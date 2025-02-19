export interface MediaAnalysis {
  tags: string[];
  dominantColors: string[];
  objects: string[];
  mood: string[];
  style: string[];
  confidence: number;
}

export interface PromptGeneration {
  prompt: string;
  variations: string[];
  context: {
    style: string;
    mood: string;
    elements: string[];
  };
}

export interface AIServiceConfig {
  openaiApiKey: string;
  modelVersion: string;
  maxTokens: number;
}

export interface AnalysisResult {
  mediaId: string;
  analysis: MediaAnalysis;
  generatedPrompt?: PromptGeneration;
  timestamp: number;
}
