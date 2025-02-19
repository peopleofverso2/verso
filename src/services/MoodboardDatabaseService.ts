import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { MoodboardZone, SubCategory } from '../types/moodboard';
import { MediaFile } from '../types/media';

interface MoodboardDB extends DBSchema {
  zones: {
    key: string;
    value: MoodboardZone;
  };
  subCategories: {
    key: string;
    value: SubCategory;
    indexes: { 'by-zone': string };
  };
}

export class MoodboardDatabaseService {
  private dbName = 'moodboard-db';
  private version = 1;
  private db: IDBPDatabase<MoodboardDB> | null = null;

  async initialize(): Promise<void> {
    try {
      this.db = await openDB<MoodboardDB>(this.dbName, this.version, {
        upgrade(db) {
          // Créer le store pour les zones
          if (!db.objectStoreNames.contains('zones')) {
            db.createObjectStore('zones', { keyPath: 'id' });
          }

          // Créer le store pour les sous-catégories avec un index sur la zone parente
          if (!db.objectStoreNames.contains('subCategories')) {
            const subCategoriesStore = db.createObjectStore('subCategories', { keyPath: 'id' });
            subCategoriesStore.createIndex('by-zone', 'zoneId');
          }
        },
      });
    } catch (error) {
      console.error('Error initializing moodboard database:', error);
      throw error;
    }
  }

  async saveZone(zone: MoodboardZone): Promise<void> {
    if (!this.db) await this.initialize();
    try {
      await this.db!.put('zones', zone);

      // Sauvegarder chaque sous-catégorie avec une référence à la zone
      for (const subCategory of zone.subCategories) {
        await this.saveSubCategory(subCategory, zone.id);
      }
    } catch (error) {
      console.error('Error saving zone:', error);
      throw error;
    }
  }

  async getZone(zoneId: string): Promise<MoodboardZone | undefined> {
    if (!this.db) await this.initialize();
    try {
      const zone = await this.db!.get('zones', zoneId);
      if (zone) {
        // Récupérer les sous-catégories associées
        zone.subCategories = await this.getSubCategoriesByZone(zoneId);
      }
      return zone;
    } catch (error) {
      console.error('Error getting zone:', error);
      throw error;
    }
  }

  async getAllZones(): Promise<MoodboardZone[]> {
    if (!this.db) await this.initialize();
    try {
      const zones = await this.db!.getAll('zones');
      // Récupérer les sous-catégories pour chaque zone
      for (const zone of zones) {
        zone.subCategories = await this.getSubCategoriesByZone(zone.id);
      }
      return zones;
    } catch (error) {
      console.error('Error getting all zones:', error);
      throw error;
    }
  }

  private async saveSubCategory(subCategory: SubCategory, zoneId: string): Promise<void> {
    try {
      await this.db!.put('subCategories', {
        ...subCategory,
        zoneId
      });
    } catch (error) {
      console.error('Error saving subcategory:', error);
      throw error;
    }
  }

  private async getSubCategoriesByZone(zoneId: string): Promise<SubCategory[]> {
    try {
      return await this.db!.getAllFromIndex('subCategories', 'by-zone', zoneId);
    } catch (error) {
      console.error('Error getting subcategories:', error);
      throw error;
    }
  }

  async addMediaToSubCategory(
    zoneId: string,
    subCategoryId: string,
    mediaFile: MediaFile
  ): Promise<void> {
    if (!this.db) await this.initialize();
    try {
      const subCategory = await this.db!.get('subCategories', subCategoryId);
      if (subCategory) {
        subCategory.mediaItems = [...subCategory.mediaItems, mediaFile];
        await this.saveSubCategory(subCategory, zoneId);
      }
    } catch (error) {
      console.error('Error adding media to subcategory:', error);
      throw error;
    }
  }

  async removeMediaFromSubCategory(
    zoneId: string,
    subCategoryId: string,
    mediaId: string
  ): Promise<void> {
    if (!this.db) await this.initialize();
    try {
      const subCategory = await this.db!.get('subCategories', subCategoryId);
      if (subCategory) {
        subCategory.mediaItems = subCategory.mediaItems.filter(
          media => media.metadata.id !== mediaId
        );
        await this.saveSubCategory(subCategory, zoneId);
      }
    } catch (error) {
      console.error('Error removing media from subcategory:', error);
      throw error;
    }
  }
}
