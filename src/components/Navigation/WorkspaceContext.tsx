import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { MediaMetadata } from '../../services/MediaLibraryService';

interface WorkspaceState {
  currentTool: string;
  mediaState: {
    selectedMedia: MediaMetadata | null;
    mediaList: MediaMetadata[];
  };
  projectData: {
    isDirty: boolean;
    lastSaved: Date | null;
  };
}

type WorkspaceAction =
  | { type: 'SET_CURRENT_TOOL'; payload: string }
  | { type: 'SET_SELECTED_MEDIA'; payload: MediaMetadata | null }
  | { type: 'SET_MEDIA_LIST'; payload: MediaMetadata[] }
  | { type: 'SET_PROJECT_DIRTY'; payload: boolean }
  | { type: 'SET_LAST_SAVED'; payload: Date };

const initialState: WorkspaceState = {
  currentTool: 'editor',
  mediaState: {
    selectedMedia: null,
    mediaList: [],
  },
  projectData: {
    isDirty: false,
    lastSaved: null,
  },
};

const WorkspaceContext = createContext<{
  state: WorkspaceState;
  dispatch: React.Dispatch<WorkspaceAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

const workspaceReducer = (state: WorkspaceState, action: WorkspaceAction): WorkspaceState => {
  switch (action.type) {
    case 'SET_CURRENT_TOOL':
      return {
        ...state,
        currentTool: action.payload,
      };
    case 'SET_SELECTED_MEDIA':
      return {
        ...state,
        mediaState: {
          ...state.mediaState,
          selectedMedia: action.payload,
        },
      };
    case 'SET_MEDIA_LIST':
      return {
        ...state,
        mediaState: {
          ...state.mediaState,
          mediaList: action.payload,
        },
      };
    case 'SET_PROJECT_DIRTY':
      return {
        ...state,
        projectData: {
          ...state.projectData,
          isDirty: action.payload,
        },
      };
    case 'SET_LAST_SAVED':
      return {
        ...state,
        projectData: {
          ...state.projectData,
          lastSaved: action.payload,
        },
      };
    default:
      return state;
  }
};

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(workspaceReducer, initialState);

  return (
    <WorkspaceContext.Provider value={{ state, dispatch }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
