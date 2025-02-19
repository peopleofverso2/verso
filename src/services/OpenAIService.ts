import OpenAI from 'openai';
import { MediaFile } from '../types/media';

export interface MediaAnalysis {
  tags: string[];
  category?: string;
  subCategory?: string;
  narrativeElement?: string;
  narrativePhase?: string;
  description: string;
  emotions: string[];
  visualElements: string[];
  technicalDetails: {
    composition?: string;
    lighting?: string;
    colors?: string[];
    style?: string;
  };
}

export class OpenAIService {
  private static instance: OpenAIService;
  private openai: OpenAI;

  private constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  public static getInstance(apiKey: string): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService(apiKey);
    }
    return OpenAIService.instance;
  }

  async analyzeMedia(mediaFile: MediaFile): Promise<MediaAnalysis> {
    try {
      const prompt = this.buildPrompt(mediaFile);
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: mediaFile.url,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      });

      return this.parseResponse(response.choices[0].message.content || "");
    } catch (error) {
      console.error('Error analyzing media with OpenAI:', error);
      throw error;
    }
  }

  private buildPrompt(mediaFile: MediaFile): string {
    return `Analyze this media file and provide a detailed analysis in the following JSON format:
    {
      "tags": ["list", "of", "relevant", "tags"],
      "category": "one of: Characters, Settings, Props, Ambiance, Sounds & Music",
      "subCategory": "appropriate subcategory based on the category",
      "narrativeElement": "one of: Scenes, Characters, Dialogues, Narration, Transitions",
      "narrativePhase": "one of: Exposition, Development, Climax, Denouement, Resolution",
      "description": "detailed description of the media",
      "emotions": ["list", "of", "emotions", "evoked"],
      "visualElements": ["list", "of", "key", "visual", "elements"],
      "technicalDetails": {
        "composition": "description of composition",
        "lighting": "description of lighting",
        "colors": ["main", "colors", "used"],
        "style": "artistic style description"
      }
    }

    Consider the media type (${mediaFile.metadata.type}) and provide relevant analysis.
    For images and videos, focus on visual elements.
    For audio, focus on sound characteristics and emotional impact.`;
  }

  private parseResponse(response: string): MediaAnalysis {
    try {
      // Nettoyer la réponse pour s'assurer qu'elle ne contient que du JSON valide
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const analysis = JSON.parse(cleanResponse);

      return {
        tags: analysis.tags || [],
        category: analysis.category,
        subCategory: analysis.subCategory,
        narrativeElement: analysis.narrativeElement,
        narrativePhase: analysis.narrativePhase,
        description: analysis.description || '',
        emotions: analysis.emotions || [],
        visualElements: analysis.visualElements || [],
        technicalDetails: {
          composition: analysis.technicalDetails?.composition,
          lighting: analysis.technicalDetails?.lighting,
          colors: analysis.technicalDetails?.colors || [],
          style: analysis.technicalDetails?.style,
        },
      };
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      throw error;
    }
  }
}
