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

export const processPdfFile = async (file: File): Promise<ProcessedPdfData> => {
  const { data } = await readFileAsBase64(file);
  
  // Try lightweight text extraction for text-based models
  let textContent: string | undefined;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const rawString = decoder.decode(arrayBuffer);
    
    // Extract plain text blocks between BT and ET in uncompressed streams
    const textMatches = rawString.match(/BT[\s\S]*?ET/g);
    if (textMatches && textMatches.length > 0) {
      const extractedWords: string[] = [];
      for (const block of textMatches.slice(0, 50)) {
        const parts = block.match(/\((.*?)\)\s*Tj/g);
        if (parts) {
          parts.forEach(p => {
            const clean = p.replace(/^\(/, '').replace(/\)\s*Tj$/, '');
            if (clean.trim()) extractedWords.push(clean);
          });
        }
      }
      if (extractedWords.length > 10) {
        textContent = extractedWords.join(' ');
      }
    }
  } catch (e) {
    console.warn('Lightweight PDF text extraction skipped:', e);
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
