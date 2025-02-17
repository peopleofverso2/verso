export type MediaType = 'video' | 'image' | 'audio';

export interface MediaMetadata {
  id: string;
  type: MediaType;
  mimeType: string;
  name: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  duration?: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface MediaFile {
  metadata: MediaMetadata;
  url: string;
  thumbnailUrl?: string;
}

export interface MediaFilter {
  type?: MediaType;
  tags?: string[];
  search?: string;
}

export interface MediaNodeData {
  mediaId?: string;
  mediaType?: 'video' | 'image';
  audioId?: string;
  content?: {
    timer?: {
      duration: number;
      autoTransition: boolean;
      loop: boolean;
    };
    audio?: {
      loop?: boolean;
      volume?: number;
      fadeIn?: number;
      fadeOut?: number;
    };
    choices?: Array<{
      id: string;
      text: string;
    }>;
  };
  onMediaEnd?: (id: string) => void;
  onDataChange?: (id: string, data: any) => void;
  onChoiceSelect?: (id: string, choice: any) => void;
  isPlaybackMode?: boolean;
}

export interface MediaNodeProps {
  id: string;
  data: MediaNodeData;
  selected?: boolean;
}

export interface MediaCardProps {
  mediaFile: MediaFile;
  onDelete?: (mediaFile: MediaFile) => void;
  onUpdate?: (mediaFile: MediaFile) => void;
  selected?: boolean;
  onSelect?: () => void;
}

export interface MediaLibraryProps {
  onSelect?: (mediaFiles: MediaFile[]) => void;
  multiSelect?: boolean;
  initialSelectedMedia?: MediaFile[];
  acceptedTypes?: string[];
}
