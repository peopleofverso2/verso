import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, IconButton, Tooltip, styled } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import MovieIcon from '@mui/icons-material/Movie';
import ImageIcon from '@mui/icons-material/Image';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import SettingsIcon from '@mui/icons-material/Settings';

const NavbarContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '64px',
  height: '100vh',
  backgroundColor: '#1E1E1E', // DaVinci style dark theme
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(1),
  gap: theme.spacing(1),
  borderRight: '1px solid rgba(255, 255, 255, 0.1)',
  zIndex: theme.zIndex.appBar,
}));

const NavButton = styled(IconButton)(({ theme, active }: { theme: any, active: boolean }) => ({
  color: active ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.7)',
  width: '48px',
  height: '48px',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: theme.palette.primary.main,
  },
  transition: 'all 0.2s ease-in-out',
}));

const Logo = styled('img')({
  width: '32px',
  height: '32px',
  margin: '8px 0 16px 0',
});

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: HomeIcon, tooltip: 'Home' },
    { path: '/editor', icon: MovieIcon, tooltip: 'Editor' },
    { path: '/moodboard', icon: ImageIcon, tooltip: 'Moodboard' },
    { path: '/storytelling', icon: AutoStoriesIcon, tooltip: 'Storytelling' },
    { path: '/settings', icon: SettingsIcon, tooltip: 'Settings' },
  ];

  return (
    <NavbarContainer>
      <Logo src="/logo.png" alt="Logo" />
      
      {navItems.map(({ path, icon: Icon, tooltip }) => (
        <Tooltip 
          key={path} 
          title={tooltip} 
          placement="right"
          arrow
        >
          <NavButton
            active={isActive(path)}
            onClick={() => navigate(path)}
          >
            <Icon />
          </NavButton>
        </Tooltip>
      ))}
    </NavbarContainer>
  );
};
