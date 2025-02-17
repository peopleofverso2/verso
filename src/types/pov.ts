import { MediaFile } from './media';

export interface PovFile {
  nodes: {
    id: string;
    type: string;
    data: {
      mediaId?: string;
      audioId?: string;
      content?: {
        choices?: {
          id: string;
          text: string;
        }[];
        videoUrl?: string;
        video?: {
          url?: string;
          name?: string;
        };
      };
    };
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    data?: {
      label?: string;
    };
  }[];
  media?: Record<string, MediaFile>;
}
