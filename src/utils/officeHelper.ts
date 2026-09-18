/**
 * 办公文档 (Word, PowerPoint, Excel, CSV) 与代码/学术文档纯前端原生解析器
 * 基于 Web 标准原生 DecompressionStream('deflate-raw') 解压 OpenXML 压缩包
 * 零额外沉重 npm 依赖，零安全与内存负担
 */

export interface ProcessedOfficeData {
  fileName: string;
  fileSize: number;
  format: 'docx' | 'pptx' | 'xlsx' | 'csv' | 'code' | 'text';
  textContent: string;
  data?: string;
}

/**
 * 判断是否为办公文档
 */
export function isOfficeFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return (
    lower.endsWith('.docx') ||
    lower.endsWith('.pptx') ||
    lower.endsWith('.xlsx') ||
    lower.endsWith('.csv') ||
    lower.endsWith('.tsv')
  );
}

/**
 * 判断是否为受支持的学术、数据与代码脚本格式
 */
export function isCodeOrTextFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return /\.(txt|md|markdown|tex|latex|bib|typ|py|cpp|c|h|hpp|java|rs|go|ts|js|jsx|tsx|html|css|json|yaml|yml|toml|xml|sql|sh|bash|bat|ps1|r|m|jl|rtf|log)$/i.test(
    lower
  );
}

/**
 * 获取文件对应的代码语言高亮标识
 */
export function getFileLanguage(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.py')) return 'python';
  if (lower.endsWith('.tex') || lower.endsWith('.latex')) return 'latex';
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'markdown';
  if (lower.endsWith('.cpp') || lower.endsWith('.c') || lower.endsWith('.h') || lower.endsWith('.hpp')) return 'cpp';
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'typescript';
  if (lower.endsWith('.js') || lower.endsWith('.jsx')) return 'javascript';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return 'yaml';
  if (lower.endsWith('.sql')) return 'sql';
  if (lower.endsWith('.r')) return 'r';
  if (lower.endsWith('.m')) return 'matlab';
  if (lower.endsWith('.java')) return 'java';
  if (lower.endsWith('.rs')) return 'rust';
  if (lower.endsWith('.go')) return 'go';
  if (lower.endsWith('.html')) return 'html';
  if (lower.endsWith('.css')) return 'css';
  if (lower.endsWith('.csv') || lower.endsWith('.tsv')) return 'csv';
  return 'text';
}

/**
 * 纯 JS 遍历 ZIP 归档，解压目标文件内容 (采用原生 DecompressionStream)
 */
async function extractZipEntries(
  arrayBuffer: ArrayBuffer,
  targetPrefixes: string[]
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  let offset = 0;

  while (offset + 30 <= bytes.length) {
    const sig = view.getUint32(offset, true);
    if (sig !== 0x04034b50) break; // Local file header signature

    const compMethod = view.getUint16(offset + 8, true);
    const compSize = view.getUint32(offset + 18, true);
    const fnLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);

    const fnBytes = bytes.slice(offset + 30, offset + 30 + fnLen);
    const fn = new TextDecoder().decode(fnBytes);

    const dataStart = offset + 30 + fnLen + extraLen;
    const dataBytes = bytes.slice(dataStart, dataStart + compSize);

    const isTarget = targetPrefixes.some(p => fn === p || fn.startsWith(p));
    if (isTarget) {
      try {
        if (compMethod === 0) {
          // 未压缩
          results.set(fn, new TextDecoder().decode(dataBytes));
        } else if (compMethod === 8 && typeof DecompressionStream !== 'undefined') {
          // Deflate 压缩
          const ds = new DecompressionStream('deflate-raw');
          const writer = ds.writable.getWriter();
          writer.write(dataBytes as any);
          writer.close();

          const chunks: Uint8Array[] = [];
          const reader = ds.readable.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) chunks.push(value);
          }
          const total = chunks.reduce((a, b) => a + b.length, 0);
          const merged = new Uint8Array(total);
          let off = 0;
          for (const c of chunks) {
            merged.set(c, off);
            off += c.length;
          }
          results.set(fn, new TextDecoder().decode(merged));
        }
      } catch (err) {
        console.warn(`Failed to decompress entry ${fn}:`, err);
      }
    }

    offset = dataStart + compSize;
  }

  return results;
}

/**
 * 解析 Word (.docx) 中的 document.xml 为 Markdown
 */
function parseDocxXml(xml: string): string {
  const paragraphs: string[] = [];

  // 解析所有段落 <w:p>
  const pMatches = xml.matchAll(/<w:p(?:\s+[^>]*)?>(.*?)<\/w:p>/gs);
  for (const pMatch of pMatches) {
    const pContent = pMatch[1];

    // 检测是否为标题 (Heading)
    let isHeading = false;
    let headingLevel = 2;
    const styleMatch = pContent.match(/<w:pStyle\s+w:val="Heading(\d+)"/i);
    if (styleMatch) {
      isHeading = true;
      headingLevel = Math.min(6, Math.max(1, parseInt(styleMatch[1], 10)));
    }

    // 提取段落内所有文本 <w:t>
    const tMatches = pContent.matchAll(/<w:t(?:\s+[^>]*)?>(.*?)<\/w:t>/gs);
    let paragraphText = '';
    for (const tMatch of tMatches) {
      paragraphText += tMatch[1];
    }

    const clean = paragraphText.trim();
    if (clean) {
      if (isHeading) {
        paragraphs.push(`${'#'.repeat(headingLevel)} ${clean}`);
      } else {
        paragraphs.push(clean);
      }
    }
  }

  return paragraphs.join('\n\n');
}

/**
 * 解析 PowerPoint (.pptx) 中的幻灯片 XML 为带分页的 Markdown
 */
function parsePptxSlides(entries: Map<string, string>): string {
  const slides: Array<{ num: number; text: string }> = [];

  for (const [path, xml] of entries.entries()) {
    const match = path.match(/ppt\/slides\/slide(\d+)\.xml/i);
    if (match) {
      const slideNum = parseInt(match[1], 10);
      const texts: string[] = [];
      const tMatches = xml.matchAll(/<a:t>(.*?)<\/a:t>/gs);
      for (const tm of tMatches) {
        const str = tm[1].trim();
        if (str) texts.push(str);
      }
      if (texts.length > 0) {
        slides.push({
          num: slideNum,
          text: texts.join('\n')
        });
      }
    }
  }

  slides.sort((a, b) => a.num - b.num);
  return slides.map(s => `### 幻灯片 ${s.num}\n${s.text}`).join('\n\n');
}

/**
 * 解析 Excel (.xlsx) 中的 sharedStrings 与 sheet1 为 Markdown 表格
 */
function parseXlsxData(entries: Map<string, string>): string {
  const ssXml = entries.get('xl/sharedStrings.xml') || '';
  const sheetXml =
    entries.get('xl/worksheets/sheet1.xml') ||
    Array.from(entries.entries()).find(([k]) => k.startsWith('xl/worksheets/sheet'))?.[1] ||
    '';

  if (!sheetXml) return '';

  // 1. 提取 Shared Strings 共享字符串表
  const sharedStrings: string[] = [];
  const siMatches = ssXml.matchAll(/<si>(.*?)<\/si>/gs);
  for (const m of siMatches) {
    const tMatches = m[1].matchAll(/<t[^>]*>(.*?)<\/t>/gs);
    let str = '';
    for (const tm of tMatches) {
      str += tm[1];
    }
    sharedStrings.push(str);
  }

  // 2. 提取表格行数据
  const rows: string[][] = [];
  const rowMatches = sheetXml.matchAll(/<row[^>]*>(.*?)<\/row>/gs);
  for (const rm of rowMatches) {
    const cells: string[] = [];
    const cellMatches = rm[1].matchAll(
      /<c\s+r="([A-Z]+)(\d+)"(?:\s+t="([a-z]+)")?[^>]*>(?:<v>(.*?)<\/v>)?<\/c>/gs
    );
    for (const cm of cellMatches) {
      const type = cm[3];
      const val = cm[4];
      let cellText = '';
      if (type === 's' && val !== undefined) {
        const idx = parseInt(val, 10);
        cellText = sharedStrings[idx] || '';
      } else if (val !== undefined) {
        cellText = val;
      }
      cells.push(cellText.replace(/\|/g, '\\|'));
    }
    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  if (rows.length === 0) return '';

  // 补齐列宽并格式化为标准 Markdown 表格
  const maxCols = Math.min(30, Math.max(...rows.map(r => r.length)));
  const normalized = rows.slice(0, 100).map(r => {
    const rowSlice = r.slice(0, maxCols);
    while (rowSlice.length < maxCols) rowSlice.push('');
    return rowSlice;
  });

  const header = normalized[0];
  const separator = header.map(() => '---');
  const body = normalized.slice(1);

  return [
    '| ' + header.join(' | ') + ' |',
    '| ' + separator.join(' | ') + ' |',
    ...body.map(r => '| ' + r.join(' | ') + ' |')
  ].join('\n');
}

/**
 * 解析 CSV / TSV 为 Markdown 表格
 */
function parseCsvToMarkdown(content: string, isTsv = false): string {
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return '';

  const delimiter = isTsv ? '\t' : ',';
  const rows: string[][] = lines.slice(0, 100).map(line =>
    line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, '').replace(/\|/g, '\\|'))
  );

  const maxCols = Math.max(...rows.map(r => r.length));
  const normalized = rows.map(r => {
    while (r.length < maxCols) r.push('');
    return r;
  });

  const header = normalized[0];
  const separator = header.map(() => '---');
  const body = normalized.slice(1);

  return [
    '| ' + header.join(' | ') + ' |',
    '| ' + separator.join(' | ') + ' |',
    ...body.map(r => '| ' + r.join(' | ') + ' |')
  ].join('\n');
}

/**
 * 统一处理 Office 文档文件
 */
export async function processOfficeFile(file: File): Promise<ProcessedOfficeData> {
  const fileName = file.name;
  const lower = fileName.toLowerCase();
  const fileSize = file.size;

  if (lower.endsWith('.csv') || lower.endsWith('.tsv')) {
    const text = await file.text();
    const mdTable = parseCsvToMarkdown(text, lower.endsWith('.tsv'));
    return {
      fileName,
      fileSize,
      format: 'csv',
      textContent: mdTable || text
    };
  }

  const arrayBuffer = await file.arrayBuffer();

  if (lower.endsWith('.docx')) {
    const entries = await extractZipEntries(arrayBuffer, ['word/document.xml']);
    const docXml = entries.get('word/document.xml') || '';
    const textContent = parseDocxXml(docXml) || '*(未能提取到 Word 文档正文内容)*';
    return {
      fileName,
      fileSize,
      format: 'docx',
      textContent
    };
  }

  if (lower.endsWith('.pptx')) {
    const entries = await extractZipEntries(arrayBuffer, ['ppt/slides/']);
    const textContent = parsePptxSlides(entries) || '*(未能提取到 PowerPoint 幻灯片文字)*';
    return {
      fileName,
      fileSize,
      format: 'pptx',
      textContent
    };
  }

  if (lower.endsWith('.xlsx')) {
    const entries = await extractZipEntries(arrayBuffer, [
      'xl/sharedStrings.xml',
      'xl/worksheets/sheet1.xml',
      'xl/worksheets/'
    ]);
    const textContent = parseXlsxData(entries) || '*(未能提取到 Excel 工作表数据)*';
    return {
      fileName,
      fileSize,
      format: 'xlsx',
      textContent
    };
  }

  // 默认文本回退
  const text = await file.text();
  return {
    fileName,
    fileSize,
    format: 'text',
    textContent: text
  };
}
