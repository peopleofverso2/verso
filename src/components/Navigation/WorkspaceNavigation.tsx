import React from 'react';
import { styled } from '@mui/material/styles';
import { Box, IconButton, Tooltip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import StorageIcon from '@mui/icons-material/Storage';

// Styled components
const NavigationBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#1E1E1E',
  height: '48px',
  padding: '0 16px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
}));

const ToolButton = styled(IconButton)(({ theme }) => ({
  margin: '0 4px',
  padding: '8px',
  borderRadius: '4px',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: theme.palette.primary.main,
  },
}));

export interface Tool {
  id: string;
  name: string;
  icon: React.ReactNode;
  path: string;
}

interface WorkspaceNavigationProps {
  tools: Tool[];
}

export const WorkspaceNavigation: React.FC<WorkspaceNavigationProps> = ({ tools }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleToolChange = (path: string) => {
    navigate(path);
  };

  return (
    <NavigationBar>
      {tools.map((tool) => (
        <Tooltip key={tool.id} title={tool.name} placement="bottom">
          <ToolButton
            sx={{ color: location.pathname === tool.path ? 'primary.main' : 'rgba(255, 255, 255, 0.7)' }}
            onClick={() => handleToolChange(tool.path)}
          >
            {tool.icon}
          </ToolButton>
        </Tooltip>
      ))}
      <Tooltip title="Storage" placement="bottom">
        <ToolButton
          sx={{ color: location.pathname === '/storage' ? 'primary.main' : 'rgba(255, 255, 255, 0.7)' }}
          onClick={() => navigate('/storage')}
        >
          <StorageIcon />
        </ToolButton>
      </Tooltip>
    </NavigationBar>
  );
};
