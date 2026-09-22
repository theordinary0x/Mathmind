import { PropositionNode, PropositionType } from '../../types';
import { 
  AiIngestionInput, 
  AiSettings, 
  ExtractedProposition, 
  IngestionBuildMode 
} from '../../types/ai';
import { buildSystemPrompt, buildUserPromptText, buildRefineUserPromptText } from './prompts';
import { callGeminiApi } from './geminiClient';
import { callOpenAiCompatibleApi } from './openaiClient';

const VALID_TYPES: PropositionType[] = ['axiom', 'definition', 'proposition', 'theorem', 'corollary', 'remark'];

export const cleanAndParseAiJson = (rawText: string): ExtractedProposition[] => {
  let cleaned = rawText.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  // Find outermost JSON object
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  if (startIdx >= 0 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err: any) {
    throw new Error(`AI 返回的结果无法解析为标准 JSON 格式: ${err.message}\n原始返回摘要:\n${rawText.slice(0, 300)}`);
  }

  const rawList = Array.isArray(parsed) 
    ? parsed 
    : (parsed.propositions || parsed.nodes || parsed.data || []);

  if (!Array.isArray(rawList) || rawList.length === 0) {
    throw new Error('AI 未能从提供的材料中识别出任何有效的数学命题。请提供更清晰的教材段落或截图。');
  }

  // Validate and sanitize each proposition
  const sanitized: ExtractedProposition[] = rawList.map((item: any, idx: number) => {
    let type: PropositionType = 'proposition';
    const lowerType = String(item.type || '').toLowerCase();
    if (VALID_TYPES.includes(lowerType as PropositionType)) {
      type = lowerType as PropositionType;
    } else if (lowerType.includes('def') || lowerType.includes('定义')) {
      type = 'definition';
    } else if (lowerType.includes('thm') || lowerType.includes('theorem') || lowerType.includes('定理')) {
      type = 'theorem';
    } else if (lowerType.includes('axiom') || lowerType.includes('公理')) {
      type = 'axiom';
    } else if (lowerType.includes('cor') || lowerType.includes('推论')) {
      type = 'corollary';
    } else if (lowerType.includes('remark') || lowerType.includes('注记') || lowerType.includes('评注')) {
      type = 'remark';
    }

    const tempId = item.tempId ? String(item.tempId) : `extracted_${Date.now()}_${idx + 1}`;
    const title = String(item.title || `未命名命题 ${idx + 1}`).trim();
    const statement = String(item.statement || item.content || '').trim();
    const proof_sketch = String(item.proof_sketch || item.intuition || '').trim();
    const full_proof = (item.full_proof || item.proof || item.proof_detail)
      ? String(item.full_proof || item.proof || item.proof_detail).trim()
      : undefined;

    const existingDeps = Array.isArray(item.depends_on_existing_ids) 
      ? item.depends_on_existing_ids.map(String) 
      : [];
    const newDeps = Array.isArray(item.depends_on_new_temp_ids) 
      ? item.depends_on_new_temp_ids.map(String) 
      : [];

    return {
      tempId,
      type,
      title,
      statement,
      proof_sketch,
      full_proof,
      depends_on_existing_ids: existingDeps,
      depends_on_new_temp_ids: newDeps
    };
  });

  return sanitized;
};

export const extractMathPropositions = async (
  input: AiIngestionInput,
  buildMode: IngestionBuildMode,
  existingNodes: PropositionNode[],
  settings: AiSettings
): Promise<ExtractedProposition[]> => {
  const systemPrompt = buildSystemPrompt(buildMode, existingNodes);
  const userPromptText = buildUserPromptText(
    input.text,
    input.image?.fileName || input.pdf?.fileName
  );

  let rawResponse = '';
  if (settings.provider === 'gemini') {
    rawResponse = await callGeminiApi(systemPrompt, userPromptText, input, settings);
  } else {
    rawResponse = await callOpenAiCompatibleApi(systemPrompt, userPromptText, input, settings);
  }

  return cleanAndParseAiJson(rawResponse);
};

export const refineMathPropositions = async (
  currentNodes: ExtractedProposition[],
  userInstruction: string,
  input: AiIngestionInput,
  buildMode: IngestionBuildMode,
  existingNodes: PropositionNode[],
  settings: AiSettings
): Promise<ExtractedProposition[]> => {
  const systemPrompt = buildSystemPrompt(buildMode, existingNodes);
  const userPromptText = buildRefineUserPromptText(
    currentNodes,
    userInstruction,
    input.text,
    input.image?.fileName || input.pdf?.fileName
  );

  let rawResponse = '';
  if (settings.provider === 'gemini') {
    rawResponse = await callGeminiApi(systemPrompt, userPromptText, input, settings);
  } else {
    rawResponse = await callOpenAiCompatibleApi(systemPrompt, userPromptText, input, settings);
  }

  return cleanAndParseAiJson(rawResponse);
};
