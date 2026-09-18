import { PropositionNode } from '../../types';
import { AiSettings } from '../../types/ai';
import { GraphMutationDiff, CopilotMessage } from '../../types/copilot';
import { buildCopilotSystemPrompt } from './copilotPrompts';

export interface CopilotApiResponse {
  text: string;
  diff?: GraphMutationDiff;
  rawResponse?: string;
}

/**
 * 从 AI 的多模态/文本回复中分离对话文本与结构化图变更集 (<<<GRAPH_DIFF ... >>>)
 */
export function parseCopilotResponse(rawText: string): CopilotApiResponse {
  const diffStartTag = '<<<GRAPH_DIFF';
  const diffEndTag = '>>>';

  const startIndex = rawText.indexOf(diffStartTag);
  if (startIndex === -1) {
    return {
      text: rawText.trim(),
      rawResponse: rawText
    };
  }

  // 提取文字部分 (在 <<<GRAPH_DIFF 前面)
  const textPart = rawText.substring(0, startIndex).trim();

  // 提取 JSON 部分
  const afterStart = rawText.substring(startIndex + diffStartTag.length);
  const endIndex = afterStart.lastIndexOf(diffEndTag);
  let jsonString = (endIndex !== -1 ? afterStart.substring(0, endIndex) : afterStart).trim();

  // 清除可能存在的 markdown 代码块包裹 (如 ```json ... ```)
  if (jsonString.startsWith('```')) {
    jsonString = jsonString.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  try {
    const parsed = JSON.parse(jsonString);
    return {
      text: textPart || '已为您生成图谱变更方案，请在下方卡片中审查并确认应用：',
      diff: parsed as GraphMutationDiff,
      rawResponse: rawText
    };
  } catch (err: any) {
    console.warn('Failed to parse GRAPH_DIFF JSON:', err, jsonString);
    return {
      text: `${textPart}\n\n*(注：AI 尝试提出了图谱变更方案，但 JSON 格式有细微瑕疵：${err.message})*`,
      rawResponse: rawText
    };
  }
}

/**
 * 发送多轮对话请求至 Google Gemini API
 */
async function callGeminiCopilot(
  systemPrompt: string,
  history: CopilotMessage[],
  userPrompt: string,
  attachment: { mimeType: string; data: string; textContent?: string; name?: string } | undefined,
  settings: AiSettings,
  signal?: AbortSignal
): Promise<string> {
  if (!settings.apiKey.trim()) {
    throw new Error('未配置 Gemini API Key，请在系统设置中填入有效密钥。');
  }

  const baseUrl = settings.baseUrl.replace(/\/+$/, '');
  const model = settings.model || 'gemini-2.5-flash';
  const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${encodeURIComponent(settings.apiKey.trim())}`;

  // 转换对话历史为 Gemini contents 格式
  // 必须满足：首条必须为 user，且不同角色的消息轮流交替
  const contents: Array<{ role: string; parts: any[] }> = [];

  const recentHistory = history.slice(-8);
  const firstUserIdx = recentHistory.findIndex(m => m.role === 'user');
  const validHistory = firstUserIdx !== -1 ? recentHistory.slice(firstUserIdx) : [];

  for (const msg of validHistory) {
    const role = msg.role === 'assistant' ? 'model' : 'user';
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts.push({ text: msg.content });
    } else {
      contents.push({
        role,
        parts: [{ text: msg.content }]
      });
    }
  }

  // 处理文本附件或提取的文档文本
  let finalPrompt = userPrompt;
  if (attachment?.textContent) {
    finalPrompt += `\n\n【附带文件 (${attachment.name || '附件'}) 文本内容】:\n${attachment.textContent}`;
  }

  // 当前用户最新一轮消息部件
  const currentParts: any[] = [];
  if (attachment && attachment.data) {
    let safeMimeType = attachment.mimeType;
    if (!safeMimeType || safeMimeType === 'application/octet-stream') {
      if (attachment.name?.toLowerCase().endsWith('.pdf')) {
        safeMimeType = 'application/pdf';
      } else if (/\.(png|jpe?g|webp|gif|bmp)$/i.test(attachment.name || '')) {
        safeMimeType = 'image/jpeg';
      }
    }
    if (safeMimeType) {
      currentParts.push({
        inlineData: {
          mimeType: safeMimeType,
          data: attachment.data
        }
      });
    }
  }
  currentParts.push({ text: finalPrompt });

  // 确保最新一轮放入 contents，如果最后一条是 user 则合并
  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents[contents.length - 1].parts.push(...currentParts);
  } else {
    contents.push({
      role: 'user',
      parts: currentParts
    });
  }

  const requestBody = {
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    contents,
    generationConfig: {
      temperature: 0.3
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
    signal
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API 请求失败 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  if (!candidate) {
    throw new Error('Gemini API 未返回任何候选回复，可能触发了内容安全策略。');
  }

  return candidate.content?.parts?.map((p: any) => p.text || '').join('') || '';
}

/**
 * 发送多轮对话请求至 OpenAI 兼容接口 (DeepSeek / Qwen / GLM / 本地 Ollama)
 */
async function callOpenAiCopilot(
  systemPrompt: string,
  history: CopilotMessage[],
  userPrompt: string,
  attachment: { mimeType: string; data: string; textContent?: string; name?: string } | undefined,
  settings: AiSettings,
  signal?: AbortSignal
): Promise<string> {
  if (!settings.apiKey.trim() && settings.provider !== 'custom') {
    throw new Error(`未配置 ${settings.provider.toUpperCase()} API Key，请在系统设置中填入有效密钥。`);
  }

  const baseUrl = settings.baseUrl.replace(/\/+$/, '');
  const url = `${baseUrl}/chat/completions`;

  const messages: Array<{ role: string; content: any }> = [
    { role: 'system', content: systemPrompt }
  ];

  // 取最近 6 轮历史
  const recentHistory = history.slice(-6);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.role,
      content: msg.content
    });
  }

  // 处理文本附件
  let finalPrompt = userPrompt;
  if (attachment?.textContent) {
    finalPrompt += `\n\n【附带文件 (${attachment.name || '附件'}) 文本内容】:\n${attachment.textContent}`;
  }

  const isImage = attachment && (attachment.mimeType.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(attachment.name || ''));
  const isPdf = attachment && (attachment.mimeType === 'application/pdf' || attachment.name?.toLowerCase().endsWith('.pdf'));

  // 最新输入
  if (isImage && attachment?.data) {
    const safeMime = attachment.mimeType && attachment.mimeType.startsWith('image/') ? attachment.mimeType : 'image/jpeg';
    messages.push({
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: `data:${safeMime};base64,${attachment.data}`
          }
        },
        {
          type: 'text',
          text: finalPrompt
        }
      ]
    });
  } else if (isPdf) {
    if (!attachment?.textContent || attachment.textContent.trim().length < 15) {
      finalPrompt += `\n\n【提示：用户附带了 PDF 文件 (${attachment?.name})。若未能提取到连续纯文本，该 PDF 可能为纯图片扫描版。建议切换至 Google Gemini 获取原生整页 PDF 识别，或使用截图上传。】`;
    }
    messages.push({
      role: 'user',
      content: finalPrompt
    });
  } else {
    messages.push({
      role: 'user',
      content: finalPrompt
    });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (settings.apiKey.trim()) {
    headers['Authorization'] = `Bearer ${settings.apiKey.trim()}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: settings.model,
      messages,
      temperature: 0.3
    }),
    signal
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${settings.provider.toUpperCase()} API 请求失败 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  if (!choice) {
    throw new Error('接口未返回任何回复内容。');
  }

  return choice.message?.content || '';
}

/**
 * 统一的 Copilot 消息派发入口
 */
export async function sendCopilotRequest(params: {
  history: CopilotMessage[];
  userPrompt: string;
  allNodes: PropositionNode[];
  selectedNodes: PropositionNode[];
  attachment?: { mimeType: string; data: string; name?: string; textContent?: string };
  settings: AiSettings;
  signal?: AbortSignal;
}): Promise<CopilotApiResponse> {
  const { history, userPrompt, allNodes, selectedNodes, attachment, settings, signal } = params;

  const systemPrompt = buildCopilotSystemPrompt(allNodes, selectedNodes);

  let rawText = '';
  if (settings.provider === 'gemini') {
    rawText = await callGeminiCopilot(systemPrompt, history, userPrompt, attachment, settings, signal);
  } else {
    rawText = await callOpenAiCopilot(systemPrompt, history, userPrompt, attachment, settings, signal);
  }

  return parseCopilotResponse(rawText);
}
