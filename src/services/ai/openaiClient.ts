import { AiIngestionInput, AiSettings } from '../../types/ai';

export const callOpenAiCompatibleApi = async (
  systemPrompt: string,
  userPromptText: string,
  input: AiIngestionInput,
  settings: AiSettings
): Promise<string> => {
  if (!settings.apiKey.trim() && settings.provider !== 'custom') {
    throw new Error(`未配置 ${settings.provider.toUpperCase()} API Key，请先填入有效密钥。`);
  }

  const baseUrl = settings.baseUrl.replace(/\/+$/, '');
  const url = `${baseUrl}/chat/completions`;

  // Build user content
  let userContent: any = userPromptText;

  if (input.mode === 'image' && input.image) {
    userContent = [
      {
        type: 'image_url',
        image_url: {
          url: `data:${input.image.mimeType};base64,${input.image.data}`
        }
      },
      {
        type: 'text',
        text: userPromptText
      }
    ];
  } else if (input.mode === 'pdf' && input.pdf) {
    if (input.pdf.textContent && input.pdf.textContent.trim().length > 10) {
      userContent = `${userPromptText}\n\n【提取出的 PDF 文本内容】:\n${input.pdf.textContent}`;
    } else {
      userContent = `${userPromptText}\n\n【用户上传了 PDF 文件: ${input.pdf.fileName}】\n提示：该 PDF 未能提取到连续纯文本（可能为图片扫描版）。建议截取重点定理后作为图片上传，或切换至 Google Gemini（原生支持整页 PDF 解析）。`;
    }
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent }
  ];

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (settings.apiKey.trim()) {
    headers['Authorization'] = `Bearer ${settings.apiKey.trim()}`;
  }

  const requestBody: Record<string, any> = {
    model: settings.model,
    messages,
    temperature: 0.15
  };

  // Enable json_object for supported models
  if (settings.provider === 'deepseek' || settings.provider === 'qwen' || settings.provider === 'glm') {
    requestBody['response_format'] = { type: 'json_object' };
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
  } catch (err: any) {
    throw new Error(`请求 ${settings.provider} 接口连接失败: ${err.message || err}`);
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.error?.message || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = `HTTP ${response.status} ${response.statusText}`;
    }
    throw new Error(`${settings.provider.toUpperCase()} 接口返回错误 (${response.status}): ${errorDetail}`);
  }

  const result = await response.json();
  const text = result?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error(`${settings.provider.toUpperCase()} 未能返回有效内容。`);
  }

  return text;
};
