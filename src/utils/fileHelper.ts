export interface ProcessedImageData {
  mimeType: string;
  data: string; // Base64 without data: prefix
  previewUrl: string;
  fileName: string;
}

export interface ProcessedPdfData {
  fileName: string;
  fileSize: number;
  data: string; // Base64 without data: prefix
  textContent?: string;
}

export const readFileAsBase64 = (file: File): Promise<{ data: string; fullDataUrl: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const full = reader.result as string;
      const commaIdx = full.indexOf(',');
      const data = commaIdx >= 0 ? full.slice(commaIdx + 1) : full;
      resolve({ data, fullDataUrl: full });
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

export const processImageFile = async (file: File): Promise<ProcessedImageData> => {
  const { data, fullDataUrl } = await readFileAsBase64(file);
  return {
    mimeType: file.type || 'image/jpeg',
    data,
    previewUrl: fullDataUrl,
    fileName: file.name
  };
};

function cleanPdfString(str: string): string {
  return str
    .replace(/\\([0-7]{1,3})/g, (_, oct) => {
      try {
        return String.fromCharCode(parseInt(oct, 8));
      } catch {
        return '';
      }
    })
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .trim();
}

function extractWordsFromPdfText(streamContent: string): string[] {
  const words: string[] = [];

  // 1. (text) Tj
  const tjMatches = streamContent.matchAll(/\((.*?)\)\s*Tj/g);
  for (const m of tjMatches) {
    const clean = cleanPdfString(m[1]);
    if (clean) words.push(clean);
  }

  // 2. [(t1) 20 (t2)] TJ
  const arrayMatches = streamContent.matchAll(/\[(.*?)\]\s*TJ/gs);
  for (const m of arrayMatches) {
    const inner = m[1];
    const itemMatches = inner.matchAll(/\((.*?)\)/g);
    for (const im of itemMatches) {
      const clean = cleanPdfString(im[1]);
      if (clean) words.push(clean);
    }
  }

  return words;
}

async function decompressFlateBytes(bytes: Uint8Array): Promise<string> {
  if (typeof DecompressionStream === 'undefined') return '';
  for (const format of ['deflate', 'deflate-raw'] as const) {
    try {
      const ds = new DecompressionStream(format);
      const writer = ds.writable.getWriter();
      writer.write(bytes as any);
      writer.close();
      const chunks: Uint8Array[] = [];
      const reader = ds.readable.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      const total = chunks.reduce((acc, c) => acc + c.length, 0);
      const merged = new Uint8Array(total);
      let off = 0;
      for (const c of chunks) {
        merged.set(c, off);
        off += c.length;
      }
      return new TextDecoder('latin1').decode(merged);
    } catch {
      // try next format
    }
  }
  return '';
}

export const processPdfFile = async (file: File): Promise<ProcessedPdfData> => {
  const { data } = await readFileAsBase64(file);
  
  let textContent: string | undefined;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const rawBytes = new Uint8Array(arrayBuffer);
    const latin1 = new TextDecoder('latin1').decode(rawBytes);

    const allWords: string[] = [];

    // 1. 先尝试检索所有 stream 数据块（含 Flate 压缩流与未压缩流）
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let match: RegExpExecArray | null;
    let streamCount = 0;

    while ((match = streamRegex.exec(latin1)) !== null && streamCount < 120) {
      streamCount++;
      const streamStart = match.index + match[0].indexOf('\n') + 1;
      const streamLen = match[1].length;
      const streamBytes = rawBytes.slice(streamStart, streamStart + streamLen);

      // 尝试解压 Flate 压缩内容
      const decompressed = await decompressFlateBytes(streamBytes);
      if (decompressed) {
        const words = extractWordsFromPdfText(decompressed);
        allWords.push(...words);
      } else {
        // 未压缩流直接匹配
        const words = extractWordsFromPdfText(match[1]);
        allWords.push(...words);
      }
    }

    // 2. 如果未能从 stream 匹配到，回退全局全文 BT ... ET 检索
    if (allWords.length === 0) {
      const textMatches = latin1.match(/BT[\s\S]*?ET/g);
      if (textMatches && textMatches.length > 0) {
        for (const block of textMatches.slice(0, 100)) {
          const words = extractWordsFromPdfText(block);
          allWords.push(...words);
        }
      }
    }

    if (allWords.length > 5) {
      // 聚合词汇，避免过量占用并保持段落连贯
      textContent = allWords.slice(0, 30000).join(' ');
    }
  } catch (e) {
    console.warn('PDF text extraction error:', e);
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    data,
    textContent
  };
};

export const extractImageFromClipboard = async (
  items: DataTransferItemList
): Promise<ProcessedImageData | null> => {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) {
        return await processImageFile(file);
      }
    }
  }
  return null;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
