import { AiIngestionInput, AiSettings } from '../../types/ai';

export const callGeminiApi = async (
  systemPrompt: string,
  userPromptText: string,
  input: AiIngestionInput,
  settings: AiSettings
): Promise<string> => {
  if (!settings.apiKey.trim()) {
    throw new Error('未配置 Gemini API Key，请先填入有效密钥。');
  }

  const baseUrl = settings.baseUrl.replace(/\/+$/, '');
  const model = settings.model || 'gemini-2.5-flash';
  const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${encodeURIComponent(settings.apiKey.trim())}`;

  const parts: Array<Record<string, any>> = [];

  // Add media parts if provided
  if (input.mode === 'image' && input.image) {
    parts.push({
      inlineData: {
        mimeType: input.image.mimeType || 'image/jpeg',
        data: input.image.data
      }
    });
  } else if (input.mode === 'pdf' && input.pdf) {
    parts.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: input.pdf.data
      }
    });
  }

  // Add text prompt
  parts.push({
    text: userPromptText
  });

  const requestBody = {
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [
      {
        role: 'user',
        parts
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.15
    }
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
  } catch (err: any) {
    throw new Error(`网络连接失败，请检查网络或是否需要代理连接: ${err.message || err}`);
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.error?.message || JSON.stringify(errJson);
    } catch {
      errorDetail = `HTTP ${response.status} ${response.statusText}`;
    }
    throw new Error(`Gemini 接口响应异常 (${response.status}): ${errorDetail}`);
  }

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini 未能返回有效内容或响应被内容安全过滤器拦截。');
  }

  return text;
};
