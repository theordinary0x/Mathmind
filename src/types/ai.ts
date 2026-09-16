import { PropositionType } from '../types';

export type AiProvider = 'gemini' | 'deepseek' | 'qwen' | 'glm' | 'custom';

export interface AiSettings {
  provider: AiProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface ExtractedProposition {
  tempId: string;
  type: PropositionType;
  title: string;
  statement: string;
  proof_sketch: string;
  note?: string;
  full_proof?: string;
  /** References to existing node IDs on current canvas */
  depends_on_existing_ids: string[];
  /** References to other newly extracted propositions in this batch (tempId) */
  depends_on_new_temp_ids: string[];
}

export interface AiIngestionInput {
  mode: 'text' | 'image' | 'pdf';
  text?: string;
  image?: {
    mimeType: string;
    /** Base64 string without data: prefix */
    data: string;
    /** Full data URL for UI preview */
    previewUrl: string;
    fileName?: string;
  };
  pdf?: {
    fileName: string;
    fileSize: number;
    /** Base64 string without data: prefix */
    data: string;
    /** Text extracted from PDF if available */
    textContent?: string;
  };
}

export type IngestionBuildMode = 'batch' | 'single';
