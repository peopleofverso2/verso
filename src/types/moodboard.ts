import { MediaMetadata } from './media';

export interface MoodBoard {
  id: string;
  name: string;
  description: string;
  tags: string[];
  mediaIds: string[];
  profile?: MoodBoardProfile;
  createdAt: string;
  updatedAt: string;
}

export interface MoodBoardProfile {
  description: string;
  generatedPrompt: string;
  dominantColors?: string[];
  visualStyle?: string;
  mood?: string;
  themes?: string[];
  visualElements?: {
    type: string;
    description: string;
    count: number;
  }[];
  storyboardSuggestions?: {
    sceneDescription: string;
    visualElements: string[];
    mood: string;
    lighting: string;
    composition: string;
  }[];
}

export interface MoodBoardFilter {
  tags?: string[];
  search?: string;
}
