import { MoodBoard, MoodBoardProfile, MoodBoardFilter } from '../types/moodboard';
import { MediaLibraryService } from './MediaLibraryService';
import { MediaMetadata } from '../types/media';

export class MoodBoardService {
  private static instance: MoodBoardService;
  private readonly mediaLibrary: MediaLibraryService;
  private readonly STORE_PREFIX = 'moodboards_';

  private constructor() {
    console.log('Initializing MoodBoardService...');
    this.mediaLibrary = MediaLibraryService.getInstance();
    console.log('MoodBoardService initialized successfully');
  }

  public static getInstance(): MoodBoardService {
    if (!MoodBoardService.instance) {
      MoodBoardService.instance = new MoodBoardService();
    }
    return MoodBoardService.instance;
  }

  private getKey(id: string): string {
    return `${this.STORE_PREFIX}${id}`;
  }

  public async createMoodBoard(name: string, description: string, tags: string[] = []): Promise<MoodBoard> {
    try {
      const moodBoard: MoodBoard = {
        id: crypto.randomUUID(),
        name,
        description,
        tags,
        mediaIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const key = this.getKey(moodBoard.id);
      localStorage.setItem(key, JSON.stringify(moodBoard));
      console.log('Created mood board:', { key, moodBoard });
      return moodBoard;
    } catch (error) {
      console.error('Error creating mood board:', error);
      throw new Error('Failed to create mood board');
    }
  }

  public async getMoodBoard(id: string): Promise<MoodBoard | null> {
    try {
      const key = this.getKey(id);
      const data = localStorage.getItem(key);
      console.log('Getting mood board:', { key, data });
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting mood board:', error);
      throw new Error('Failed to get mood board');
    }
  }

  public async updateMoodBoard(id: string, updates: Partial<MoodBoard>): Promise<MoodBoard> {
    try {
      const key = this.getKey(id);
      const currentData = localStorage.getItem(key);
      if (!currentData) {
        throw new Error('Mood board not found');
      }

      const currentBoard: MoodBoard = JSON.parse(currentData);
      const updatedBoard: MoodBoard = {
        ...currentBoard,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(key, JSON.stringify(updatedBoard));
      console.log('Updated mood board:', { key, updatedBoard });
      return updatedBoard;
    } catch (error) {
      console.error('Error updating mood board:', error);
      throw new Error('Failed to update mood board');
    }
  }

  public async deleteMoodBoard(id: string): Promise<void> {
    try {
      const key = this.getKey(id);
      localStorage.removeItem(key);
      console.log('Deleted mood board:', { key });
    } catch (error) {
      console.error('Error deleting mood board:', error);
      throw new Error('Failed to delete mood board');
    }
  }

  public async listMoodBoards(filter?: MoodBoardFilter): Promise<MoodBoard[]> {
    try {
      console.log('Listing mood boards...');
      const moodBoards: MoodBoard[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORE_PREFIX)) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const moodBoard = JSON.parse(data);
              moodBoards.push(moodBoard);
            } catch (e) {
              console.error('Error parsing mood board data:', e);
            }
          }
        }
      }

      let filtered = moodBoards;

      if (filter) {
        filtered = moodBoards.filter(board => {
          if (filter.searchTerm) {
            const searchLower = filter.searchTerm.toLowerCase();
            const matches = board.name.toLowerCase().includes(searchLower) ||
                           board.description.toLowerCase().includes(searchLower) ||
                           board.tags.some(tag => tag.toLowerCase().includes(searchLower));
            if (!matches) return false;
          }

          if (filter.tags?.length) {
            if (!filter.tags.some(tag => board.tags.includes(tag))) return false;
          }

          if (filter.hasProfile !== undefined) {
            if (filter.hasProfile && !board.profile) return false;
            if (!filter.hasProfile && board.profile) return false;
          }

          return true;
        });

        if (filter.sortBy) {
          filtered.sort((a, b) => {
            const aValue = a[filter.sortBy!];
            const bValue = b[filter.sortBy!];
            const modifier = filter.sortDirection === 'desc' ? -1 : 1;
            return aValue > bValue ? modifier : -modifier;
          });
        }
      }

      const sortedBoards = filtered.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      console.log('Found mood boards:', sortedBoards);
      return sortedBoards;
    } catch (error) {
      console.error('Error listing mood boards:', error);
      throw new Error('Failed to list mood boards');
    }
  }

  public async generateProfile(id: string): Promise<MoodBoardProfile> {
    try {
      const moodBoard = await this.getMoodBoard(id);
      if (!moodBoard) {
        throw new Error('Mood board not found');
      }

      // Récupérer les métadonnées de tous les médias
      const mediaMetadata = await Promise.all(
        moodBoard.mediaIds.map(id => this.mediaLibrary.getMediaMetadata(id))
      );

      // Analyser les métadonnées pour extraire des informations pertinentes
      const allTags = new Set([...moodBoard.tags]);
      const visualElements = new Map<string, number>();
      
      mediaMetadata.forEach(meta => {
        if (meta.tags) {
          meta.tags.forEach(tag => allTags.add(tag));
        }
        
        // Compter les éléments visuels basés sur les tags
        meta.tags?.forEach(tag => {
          visualElements.set(tag, (visualElements.get(tag) || 0) + 1);
        });
      });

      // Générer des suggestions pour le storyboard
      const storyboardSuggestions = [
        {
          sceneDescription: `Scene inspirée par ${moodBoard.name}`,
          visualElements: Array.from(allTags).slice(0, 5),
          mood: moodBoard.tags[0] || 'neutre',
          lighting: 'naturelle',
          composition: 'équilibrée'
        }
      ];

      // Créer le profil
      const profile: MoodBoardProfile = {
        description: `Profil généré à partir de ${mediaMetadata.length} images`,
        generatedPrompt: `Un mood board sur le thème "${moodBoard.name}" contenant ${mediaMetadata.length} images, avec les tags: ${Array.from(allTags).join(', ')}`,
        dominantColors: ['#FFFFFF', '#000000'], // À remplacer par une vraie analyse des couleurs
        visualStyle: moodBoard.tags.find(tag => tag.includes('style')) || 'contemporain',
        mood: moodBoard.tags.find(tag => tag.includes('ambiance')) || 'neutre',
        themes: Array.from(allTags),
        visualElements: Array.from(visualElements.entries()).map(([type, count]) => ({
          type,
          description: `Élément de type ${type}`,
          count
        })),
        storyboardSuggestions
      };

      // Mettre à jour le mood board avec le nouveau profil
      await this.updateMoodBoard(id, { profile });
      
      console.log('Generated profile:', profile);
      return profile;
    } catch (error) {
      console.error('Error generating profile:', error);
      throw new Error('Failed to generate profile');
    }
  }
}
