import React from 'react';
import { Grid } from '@mui/material';
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
  onProjectDelete
}) => {
  if (projects.length === 0) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <ProjectCard />
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      {projects.map((project) => (
        <Grid item xs={12} sm={6} md={4} key={project.projectId}>
          <ProjectCard
            project={project}
            onSelect={() => onProjectSelect(project.projectId)}
            onDelete={onProjectDelete ? () => onProjectDelete(project.projectId) : undefined}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default ProjectList;
