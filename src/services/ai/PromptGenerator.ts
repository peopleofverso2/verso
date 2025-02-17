import { MediaMetadata } from '../../types/media';

export interface PromptConfig {
  style?: string;
  mood?: string;
  duration?: number;
  customInstructions?: string;
}

export class PromptGenerator {
  private static instance: PromptGenerator | null = null;

  private constructor() {}

  static getInstance(): PromptGenerator {
    if (!PromptGenerator.instance) {
      PromptGenerator.instance = new PromptGenerator();
    }
    return PromptGenerator.instance;
  }

  /**
   * Génère un prompt pour la création de vidéo basé sur un mood board
   * @param medias Liste des médias du mood board
   * @param config Configuration optionnelle pour le prompt
   * @returns Le prompt généré
   */
  generateFromMoodBoard(
    medias: MediaMetadata[],
    config?: PromptConfig
  ): string {
    try {
      const dominantStyle = this.analyzeDominantStyle(medias);
      const dominantMood = this.analyzeDominantMood(medias);
      const visualElements = this.extractVisualElements(medias);

      const prompt = this.constructPrompt({
        style: config?.style || dominantStyle,
        mood: config?.mood || dominantMood,
        visualElements,
        duration: config?.duration || 10,
        customInstructions: config?.customInstructions,
      });

      return prompt;
    } catch (error) {
      console.error('Error generating prompt:', error);
      throw new Error(`Failed to generate prompt: ${error.message}`);
    }
  }

  private analyzeDominantStyle(medias: MediaMetadata[]): string {
    // TODO: Implémenter l'analyse du style dominant
    // Pour l'instant, retourner un style par défaut
    return 'cinematic';
  }

  private analyzeDominantMood(medias: MediaMetadata[]): string {
    // TODO: Implémenter l'analyse de l'ambiance dominante
    // Pour l'instant, retourner une ambiance par défaut
    return 'neutral';
  }

  private extractVisualElements(medias: MediaMetadata[]): string[] {
    // Extraire les éléments visuels des tags des médias
    const elements = new Set<string>();
    
    medias.forEach(media => {
      media.tags.forEach(tag => elements.add(tag));
    });

    return Array.from(elements);
  }

  private constructPrompt({
    style,
    mood,
    visualElements,
    duration,
    customInstructions,
  }: {
    style: string;
    mood: string;
    visualElements: string[];
    duration: number;
    customInstructions?: string;
  }): string {
    const elements = visualElements.join(', ');
    let prompt = `Create a ${duration}-second ${style} video with a ${mood} mood. `;
    prompt += `Include the following elements: ${elements}. `;
    
    if (customInstructions) {
      prompt += customInstructions;
    }

    return prompt;
  }
}
