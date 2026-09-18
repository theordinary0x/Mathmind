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
  const contents: Array<{ role: string; parts: any[] }> = [];

  // 取最近 6 轮对话以控制上下文开销
  const recentHistory = history.slice(-6);
  for (const msg of recentHistory) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    });
  }

  // 处理文本附件
  let finalPrompt = userPrompt;
  if (attachment?.textContent) {
    finalPrompt += `\n\n【附带文件 (${attachment.name || '附件'}) 内容】:\n${attachment.textContent}`;
  }

  // 当前用户最新一轮消息
  const currentParts: any[] = [];
  if (attachment && !attachment.textContent && attachment.data) {
    currentParts.push({
      inlineData: {
        mimeType: attachment.mimeType,
        data: attachment.data
      }
    });
  }
  currentParts.push({ text: finalPrompt });

  contents.push({
    role: 'user',
    parts: currentParts
  });

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
    finalPrompt += `\n\n【附带文件 (${attachment.name || '附件'}) 内容】:\n${attachment.textContent}`;
  }

  // 最新输入
  if (attachment && !attachment.textContent && attachment.mimeType.startsWith('image/')) {
    messages.push({
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: `data:${attachment.mimeType};base64,${attachment.data}`
          }
        },
        {
          type: 'text',
          text: finalPrompt
        }
      ]
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
