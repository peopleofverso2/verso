import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Chip,
  Typography,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { ProjectMetadata } from '../../types/project';

interface SearchAndFilterProps {
  projects: ProjectMetadata[];
  onFilterChange: (filteredProjects: ProjectMetadata[]) => void;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  projects,
  onFilterChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Extraire tous les tags uniques des projets
  const allTags = Array.from(
    new Set(
      projects
        .flatMap((project) => project.scenario?.tags || [])
        .filter((tag) => tag)
    )
  );

  useEffect(() => {
    const filteredProjects = projects.filter((project) => {
      const matchesSearch =
        !searchTerm ||
        project.scenario?.scenarioTitle
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        project.scenario?.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => project.scenario?.tags?.includes(tag));

      return matchesSearch && matchesTags;
    });

    onFilterChange(filteredProjects);
  }, [searchTerm, selectedTags, projects, onFilterChange]);

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Rechercher par titre ou description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      {allTags.length > 0 && (
        <Box>
          <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
            Filtrer par tags
          </Typography>
          <Autocomplete
            multiple
            options={allTags}
            value={selectedTags}
            onChange={(_, newValue) => setSelectedTags(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder="Sélectionner des tags..."
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option}
                  {...getTagProps({ index })}
                  sx={{
                    backgroundColor: (theme) => theme.palette.primary.main,
                    color: 'white',
                  }}
                />
              ))
            }
          />
        </Box>
      )}
    </Box>
  );
};
