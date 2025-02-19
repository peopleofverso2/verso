import React from 'react';
import { Box, Typography, Button, styled } from '@mui/material';
import { useDrop } from 'react-dnd';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import DeleteIcon from '@mui/icons-material/Delete';
import { MoodboardZone } from '../../types/moodboard';
import { MediaFile } from '../../types/media';
import { MediaCard } from '../Media/MediaCard';

interface ZoneContentProps {
  zone: MoodboardZone;
  onPromptGenerate: () => void;
  onMediaDrop: (mediaFile: MediaFile, subCategoryId: string) => void;
  onMediaRemove: (mediaId: string, subCategoryId: string) => void;
}

const ZoneContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

const SubCategoriesContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  overflow: 'auto',
  flexGrow: 1,
}));

const SubCategoryBox = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  minHeight: '200px',
  display: 'flex',
  flexDirection: 'column',
}));

const MediaGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
  overflow: 'auto',
  flexGrow: 1,
}));

const SubCategory: React.FC<{
  data: MoodboardZone['subCategories'][0];
  onDrop: (mediaFile: MediaFile) => void;
  onRemove: (mediaId: string) => void;
}> = ({ data, onDrop, onRemove }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'media',
    drop: (item: MediaFile) => {
      onDrop(item);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <SubCategoryBox
      ref={drop}
      sx={{
        backgroundColor: isOver ? 'action.hover' : 'background.paper',
        transition: 'background-color 0.2s',
      }}
    >
      <Typography variant="subtitle1" gutterBottom>
        {data.name}
      </Typography>
      <MediaGrid>
        {data.mediaItems.map((mediaFile) => (
          <Box key={mediaFile.metadata.id} sx={{ position: 'relative' }}>
            <MediaCard
              mediaFile={mediaFile}
              small
            />
            <Button
              size="small"
              color="error"
              onClick={() => onRemove(mediaFile.metadata.id)}
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                minWidth: 'auto',
                p: 0.5,
              }}
            >
              <DeleteIcon fontSize="small" />
            </Button>
          </Box>
        ))}
      </MediaGrid>
    </SubCategoryBox>
  );
};

export const ZoneContent: React.FC<ZoneContentProps> = ({
  zone,
  onPromptGenerate,
  onMediaDrop,
  onMediaRemove,
}) => {
  return (
    <ZoneContainer>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">{zone.name}</Typography>
        <Button
          variant="contained"
          startIcon={<AutoFixHighIcon />}
          onClick={onPromptGenerate}
        >
          Générer Prompt
        </Button>
      </Box>

      <SubCategoriesContainer>
        {zone.subCategories.map((subCategory) => (
          <SubCategory
            key={subCategory.id}
            data={subCategory}
            onDrop={(mediaFile) => onMediaDrop(mediaFile, subCategory.id)}
            onRemove={(mediaId) => onMediaRemove(mediaId, subCategory.id)}
          />
        ))}
      </SubCategoriesContainer>
    </ZoneContainer>
  );
};
