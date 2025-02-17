import OpenAI from 'openai';

export interface ImageAnalysisResult {
  description: string;
  tags: string[];
  dominantColors: string[];
  style: string;
  mood: string;
}

interface RetryConfig {
  maxRetries: number;
  delay: number;
  backoff: number;
}

export class ImageAnalyzer {
  private static instance: ImageAnalyzer | null = null;
  private openai: OpenAI;
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    delay: 1000,
    backoff: 2
  };

  private constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });

    console.log('OpenAI client initialized with config:', {
      apiKey: `${apiKey.substring(0, 10)}...`,
      baseURL: this.openai.baseURL
    });
  }

  static getInstance(): ImageAnalyzer {
    if (!ImageAnalyzer.instance) {
      ImageAnalyzer.instance = new ImageAnalyzer();
    }
    return ImageAnalyzer.instance;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error('Operation failed:', {
        error: error.message,
        status: error.status,
        type: error.type
      });

      if (retryCount >= this.retryConfig.maxRetries) {
        throw error;
      }

      const delay = this.retryConfig.delay * Math.pow(this.retryConfig.backoff, retryCount);
      console.log(`Retrying operation after ${delay}ms (attempt ${retryCount + 1}/${this.retryConfig.maxRetries})`);
      await this.sleep(delay);

      return this.retryWithBackoff(operation, retryCount + 1);
    }
  }

  /**
   * Convertit une URL en base64
   */
  private async urlToBase64(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Vérifier si c'est déjà un data URL
          if (base64String.startsWith('data:')) {
            resolve(base64String);
          } else {
            // Ajouter le préfixe data URL si nécessaire
            resolve(`data:${blob.type};base64,${base64String.split(',')[1]}`);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting URL to base64:', error);
      throw error;
    }
  }

  /**
   * Nettoie le contenu JSON des balises markdown
   */
  private cleanJsonContent(content: string): string {
    // Enlever les balises markdown et json
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    console.log('Cleaned content:', cleanContent);
    return cleanContent;
  }

  /**
   * Analyse une image et retourne des métadonnées détaillées
   * @param imageUrl URL de l'image à analyser
   */
  async analyzeImage(imageUrl: string): Promise<ImageAnalysisResult> {
    try {
      const operation = async () => {
        console.log('Starting image analysis with URL:', imageUrl);
        
        // Convertir l'URL en base64
        const imageData = await this.urlToBase64(imageUrl);
        console.log('Image converted to base64, length:', imageData.length);
        
        console.log('Using model: gpt-4-turbo');
        const response = await this.openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this image and provide a JSON response with:\n1. Brief description\n2. List of relevant tags\n3. Dominant colors\n4. Overall style (e.g., modern, vintage)\n5. Mood/atmosphere\n\nFormat as JSON with these fields: description, tags (comma-separated), dominantColors (comma-separated), style, mood"
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageData
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        });

        console.log('OpenAI response:', {
          status: 'success',
          model: response.model,
          usage: response.usage,
          firstChoice: response.choices[0]
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('No content in response');
        }
        
        console.log('Raw content from OpenAI:', content);
        
        try {
          // Nettoyer le contenu avant de le parser
          const cleanContent = this.cleanJsonContent(content);
          const analysis = JSON.parse(cleanContent);
          console.log('Parsed analysis:', analysis);
          
          const result = {
            description: analysis.description || '',
            tags: (typeof analysis.tags === 'string' ? analysis.tags.split(',') : analysis.tags || [])
              .map((tag: string) => tag.trim())
              .filter(Boolean),
            dominantColors: (typeof analysis.dominantColors === 'string' ? analysis.dominantColors.split(',') : analysis.dominantColors || [])
              .map((color: string) => color.trim())
              .filter(Boolean),
            style: analysis.style || '',
            mood: analysis.mood || ''
          };
          
          console.log('Final result:', result);
          return result;
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError, 'Raw content:', content);
          return this.extractFromText(content);
        }
      };

      return await this.retryWithBackoff(operation);
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  }

  /**
   * Extrait les informations d'une réponse texte non-JSON
   */
  private extractFromText(text: string): ImageAnalysisResult {
    const result: ImageAnalysisResult = {
      description: '',
      tags: [],
      dominantColors: [],
      style: '',
      mood: ''
    };

    try {
      // Recherche des patterns courants dans le texte
      const descriptionMatch = text.match(/description[:\s]+([^\n]+)/i);
      if (descriptionMatch) result.description = descriptionMatch[1].trim();

      const tagsMatch = text.match(/tags[:\s]+([^\n]+)/i);
      if (tagsMatch) result.tags = tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean);

      const colorsMatch = text.match(/colors[:\s]+([^\n]+)/i);
      if (colorsMatch) result.dominantColors = colorsMatch[1].split(',').map(c => c.trim()).filter(Boolean);

      const styleMatch = text.match(/style[:\s]+([^\n,]+)/i);
      if (styleMatch) result.style = styleMatch[1].trim();

      const moodMatch = text.match(/mood[:\s]+([^\n,]+)/i);
      if (moodMatch) result.mood = moodMatch[1].trim();
    } catch (error) {
      console.error('Error extracting from text:', error);
    }

    return result;
  }

  /**
   * Analyse une image et génère uniquement des tags
   * @param imageUrl URL de l'image à analyser
   */
  async generateTags(imageUrl: string): Promise<string[]> {
    try {
      const analysis = await this.analyzeImage(imageUrl);
      return analysis.tags;
    } catch (error) {
      console.error('Error generating tags:', error);
      return [];
    }
  }

  /**
   * Analyse le style dominant d'une image
   * @param imageUrl URL de l'image à analyser
   */
  async analyzeStyle(imageUrl: string): Promise<{style: string; mood: string}> {
    try {
      const analysis = await this.analyzeImage(imageUrl);
      return {
        style: analysis.style,
        mood: analysis.mood
      };
    } catch (error) {
      console.error('Error analyzing style:', error);
      return {
        style: '',
        mood: ''
      };
    }
  }
}
