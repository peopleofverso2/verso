import OpenAI from 'openai';
import { MediaFile } from '../types/media';
import { MediaAnalysis, PromptGeneration, AnalysisResult, AIServiceConfig } from '../types/analysis';
import { MoodboardZone } from '../types/moodboard';

export class AIAnalysisService {
  private openai: OpenAI;
  private config: AIServiceConfig;

  constructor() {
    this.config = {
      openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY,
      modelVersion: 'gpt-4-vision-preview',
      maxTokens: 150
    };

    this.openai = new OpenAI({
      apiKey: this.config.openaiApiKey,
      dangerouslyAllowBrowser: true // Note: In production, API calls should go through backend
    });
  }

  async analyzeMedia(mediaFile: MediaFile): Promise<AnalysisResult> {
    try {
      const base64Image = await this.getBase64FromUrl(mediaFile.url);
      
      const analysis = await this.openai.chat.completions.create({
        model: this.config.modelVersion,
        messages: [
          {
            role: 'system',
            content: 'You are an expert in visual analysis for creative projects. Analyze the image and provide detailed information about its visual elements, style, mood, and potential use in storytelling.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this image and provide: tags, dominant colors, objects, mood, and overall style.' },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                }
              }
            ],
          }
        ],
        max_tokens: this.config.maxTokens
      });

      const result = this.parseAnalysisResponse(analysis.choices[0].message.content || '');

      return {
        mediaId: mediaFile.metadata.id,
        analysis: result,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error analyzing media:', error);
      throw error;
    }
  }

  async generatePrompt(zone: MoodboardZone): Promise<PromptGeneration> {
    try {
      const context = this.buildZoneContext(zone);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a creative director specialized in generating video prompts for AI video generation. Create compelling and detailed prompts based on mood board elements.'
          },
          {
            role: 'user',
            content: `Generate a video prompt based on this context: ${JSON.stringify(context)}`
          }
        ],
        max_tokens: 200
      });

      return this.parsePromptResponse(completion.choices[0].message.content || '');
    } catch (error) {
      console.error('Error generating prompt:', error);
      throw error;
    }
  }

  private async getBase64FromUrl(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private parseAnalysisResponse(response: string): MediaAnalysis {
    // Implémentation basique - à améliorer avec un parsing plus robuste
    return {
      tags: [],
      dominantColors: [],
      objects: [],
      mood: [],
      style: [],
      confidence: 0.8
    };
  }

  private parsePromptResponse(response: string): PromptGeneration {
    // Implémentation basique - à améliorer avec un parsing plus robuste
    return {
      prompt: response,
      variations: [response],
      context: {
        style: '',
        mood: '',
        elements: []
      }
    };
  }

  private buildZoneContext(zone: MoodboardZone) {
    const mediaItems = zone.subCategories.flatMap(sub => sub.mediaItems);
    const context = {
      zoneName: zone.name,
      zoneType: zone.type,
      subCategories: zone.subCategories.map(sub => ({
        name: sub.name,
        itemCount: sub.mediaItems.length
      })),
      totalItems: mediaItems.length
    };
    return context;
  }
}
