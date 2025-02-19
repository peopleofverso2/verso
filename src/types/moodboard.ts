import { MediaFile } from './media';

export type MoodboardZoneType = 
  | 'characters'
  | 'locations'
  | 'props'
  | 'atmosphere'
  | 'sounds';

export interface MoodboardZone {
  id: string;
  type: MoodboardZoneType;
  name: string;
  description?: string;
  subCategories: SubCategory[];
}

export interface SubCategory {
  id: string;
  name: string;
  description?: string;
  mediaItems: MediaFile[];
}

export interface MoodboardState {
  zones: MoodboardZone[];
  activeZone: string | null;
  draggedItem: MediaFile | null;
}

export interface MoodboardAnalysis {
  dominantStyle: string;
  colorPalette: string[];
  suggestedPrompts: {
    zoneId: string;
    prompt: string;
  }[];
}

// Zones de contexte prédéfinies
export const DEFAULT_ZONES: MoodboardZone[] = [
  {
    id: 'characters',
    type: 'characters',
    name: 'Personnages',
    subCategories: [
      { id: 'protagonists', name: 'Protagonistes', mediaItems: [] },
      { id: 'antagonists', name: 'Antagonistes', mediaItems: [] },
      { id: 'supporting', name: 'Secondaires', mediaItems: [] },
      { id: 'costumes', name: 'Costumes', mediaItems: [] }
    ]
  },
  {
    id: 'locations',
    type: 'locations',
    name: 'Décors',
    subCategories: [
      { id: 'urban', name: 'Urbains', mediaItems: [] },
      { id: 'nature', name: 'Naturels', mediaItems: [] },
      { id: 'interior', name: 'Intérieurs', mediaItems: [] },
      { id: 'fantasy', name: 'Fantastiques', mediaItems: [] }
    ]
  },
  {
    id: 'props',
    type: 'props',
    name: 'Accessoires',
    subCategories: [
      { id: 'quest-items', name: 'Objets de Quête', mediaItems: [] },
      { id: 'technology', name: 'Technologie', mediaItems: [] },
      { id: 'furniture', name: 'Mobilier', mediaItems: [] },
      { id: 'weapons', name: 'Armes', mediaItems: [] }
    ]
  },
  {
    id: 'atmosphere',
    type: 'atmosphere',
    name: 'Ambiance',
    subCategories: [
      { id: 'lighting', name: 'Éclairages', mediaItems: [] },
      { id: 'effects', name: 'Effets Spéciaux', mediaItems: [] },
      { id: 'textures', name: 'Textures', mediaItems: [] },
      { id: 'mood', name: 'Atmosphère', mediaItems: [] }
    ]
  },
  {
    id: 'sounds',
    type: 'sounds',
    name: 'Sons & Musiques',
    subCategories: [
      { id: 'music', name: 'Musiques', mediaItems: [] },
      { id: 'sfx', name: 'Effets Sonores', mediaItems: [] },
      { id: 'ambiance', name: 'Ambiances', mediaItems: [] },
      { id: 'voices', name: 'Voix', mediaItems: [] }
    ]
  }
];
