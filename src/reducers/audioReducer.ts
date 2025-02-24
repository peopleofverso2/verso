export type AudioState = {
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  error: string | null;
};

export type AudioAction =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_ERROR'; payload: string };

export const initialAudioState: AudioState = {
  isPlaying: false,
  volume: 1,
  isMuted: false,
  error: null,
};

export const audioReducer = (state: AudioState, action: AudioAction): AudioState => {
  switch (action.type) {
    case 'PLAY':
      return { ...state, isPlaying: true, error: null };
    case 'PAUSE':
      return { ...state, isPlaying: false };
    case 'SET_VOLUME':
      return { ...state, volume: action.payload };
    case 'TOGGLE_MUTE':
      return { ...state, isMuted: !state.isMuted };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isPlaying: false };
    default:
      return state;
  }
};
