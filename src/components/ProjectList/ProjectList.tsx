import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import { ProjectMetadata } from '../../types/project';
import ProjectCard from './ProjectCard';

interface ProjectListProps {
  projects: ProjectMetadata[];
  onProjectSelect: (projectId: string) => void;
  onProjectDelete?: (projectId: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ 
  projects, 
  onProjectSelect,
  onProjectDelete,
}) => {
  if (projects.length === 0) {
    return (
      <Box sx={{ 
        p: 3, 
        textAlign: 'center',
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 1
      }}>
        <Typography variant="body1" color="text.secondary">
          No scenarios yet. Create your first one!
        </Typography>
      </Box>
    );
  }

  return (
    <Grid 
      container 
      spacing={3}
      sx={{ 
        p: 2,
        m: -2, // Pour compenser le padding et aligner avec les bords
        width: 'auto'
      }}
    >
      {projects.map((project) => (
        <Grid item xs={12} sm={6} md={4} key={project.projectId}>
          <ProjectCard
            project={project}
            onProjectSelect={onProjectSelect}
            onProjectDelete={onProjectDelete}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default ProjectList;
