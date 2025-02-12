import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import {
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  AudioFile as AudioIcon,
  Apps as AllIcon
} from '@mui/icons-material';

export type MediaType = 'all' | 'image' | 'video' | 'audio';

interface MediaTypeFilterProps {
  value: MediaType;
  onChange: (type: MediaType) => void;
}

export default function MediaTypeFilter({ value, onChange }: MediaTypeFilterProps) {
  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: MediaType | null
  ) => {
    if (newType !== null) {
      onChange(newType);
    }
  };

  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={handleChange}
      aria-label="type de média"
      size="small"
      sx={{ mb: 2 }}
    >
      <ToggleButton value="all" aria-label="tous les médias">
        <AllIcon />
      </ToggleButton>
      <ToggleButton value="image" aria-label="images">
        <ImageIcon />
      </ToggleButton>
      <ToggleButton value="video" aria-label="vidéos">
        <VideoIcon />
      </ToggleButton>
      <ToggleButton value="audio" aria-label="audio">
        <AudioIcon />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
