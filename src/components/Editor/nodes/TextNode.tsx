import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  TextField,
  Box,
  Typography,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TextFieldsIcon from '@mui/icons-material/TextFields';

interface TextNodeProps {
  id: string;
  data: {
    content?: {
      text?: string;
      duration?: number;
      choices?: Array<{
        id: string;
        text: string;
      }>;
    };
    isPlaybackMode?: boolean;
    onDataChange?: (id: string, data: any) => void;
    onTextEnd?: (id: string) => void;
    onChoiceSelect?: (id: string, choice: any) => void;
    isCurrentNode?: boolean;
  };
  selected?: boolean;
}

export default function TextNode({ id, data, selected }: TextNodeProps) {
  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
  const [isChoicesDialogOpen, setIsChoicesDialogOpen] = useState(false);
  const [newChoiceText, setNewChoiceText] = useState('');
  const [editingChoiceId, setEditingChoiceId] = useState<string | null>(null);
  const [editingChoiceText, setEditingChoiceText] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingDuration, setEditingDuration] = useState(5);

  useEffect(() => {
    // Initialiser les données si elles n'existent pas
    if (!data.content && data.onDataChange) {
      data.onDataChange(id, {
        content: {
          text: '',
          duration: 5,
          choices: []
        }
      });
    }
  }, []);

  useEffect(() => {
    if (isTextDialogOpen) {
      setEditingText(data.content?.text || '');
      setEditingDuration(data.content?.duration || 5);
    }
  }, [isTextDialogOpen, data.content?.text, data.content?.duration]);

  // Gérer le timer
  useEffect(() => {
    if (data.isCurrentNode && data.content?.duration && data.isPlaybackMode) {
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          const newElapsed = prev + 1000;
          if (newElapsed >= (data.content?.duration || 0) * 1000) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            if (!data.content?.choices?.length && data.onTextEnd) {
              data.onTextEnd(id);
            }
            return data.content?.duration ? data.content.duration * 1000 : 0;
          }
          return newElapsed;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [data.isCurrentNode, data.content?.duration, data.isPlaybackMode]);

  const handleTextChange = useCallback(() => {
    if (data.onDataChange) {
      data.onDataChange(id, {
        ...data,
        content: {
          ...data.content,
          text: editingText,
          duration: editingDuration,
          choices: data.content?.choices || []
        }
      });
    }
    setIsTextDialogOpen(false);
  }, [id, data, editingText, editingDuration]);

  const handleAddChoice = useCallback((text: string) => {
    if (!text.trim() || !data.onDataChange) return;

    const newChoice = {
      id: Math.random().toString(36).substr(2, 9),
      text: text.trim()
    };

    const currentChoices = data.content?.choices || [];
    const updatedChoices = [...currentChoices, newChoice];

    data.onDataChange(id, {
      ...data,
      content: {
        ...data.content,
        text: data.content?.text || '',
        duration: data.content?.duration || 5,
        choices: updatedChoices
      }
    });

    setNewChoiceText('');
  }, [id, data]);

  const handleEditChoice = useCallback((choice: { id: string; text: string }) => {
    if (data.onDataChange && data.content?.choices) {
      const updatedChoices = data.content.choices.map(c => 
        c.id === choice.id ? { ...c, text: editingChoiceText } : c
      );
      
      data.onDataChange(id, {
        ...data,
        content: {
          ...data.content,
          text: data.content.text || '',
          duration: data.content.duration || 5,
          choices: updatedChoices
        }
      });
    }
    setEditingChoiceId(null);
  }, [id, data, editingChoiceText]);

  const handleDeleteChoice = useCallback((choiceId: string) => {
    if (data.onDataChange && data.content?.choices) {
      const updatedChoices = data.content.choices.filter(c => c.id !== choiceId);
      
      data.onDataChange(id, {
        ...data,
        content: {
          ...data.content,
          text: data.content.text || '',
          duration: data.content.duration || 5,
          choices: updatedChoices
        }
      });
    }
  }, [id, data]);

  const progress = data.content?.duration 
    ? (elapsed / (data.content.duration * 1000)) * 100 
    : 0;

  return (
    <div style={{ position: 'relative' }}>
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: '12px',
          height: '12px',
          background: '#555',
          border: '2px solid rgba(255, 255, 255, 0.8)',
          top: '-6px'
        }}
      />

      {(!data.content?.choices || data.content.choices.length === 0) && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            width: '12px',
            height: '12px',
            background: '#555',
            border: '2px solid rgba(255, 255, 255, 0.8)',
            bottom: '-6px'
          }}
        />
      )}

      <Paper
        elevation={selected ? 8 : 3}
        sx={{
          width: 300,
          backgroundColor: '#1e1e1e',
          border: selected ? '2px solid #1976d2' : '2px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* Zone de prévisualisation */}
        <Box sx={{ position: 'relative' }}>
          {/* Barre de progression */}
          {data.isCurrentNode && data.isPlaybackMode && data.content?.duration && (
            <Box sx={{
              width: '100%',
              height: 4,
              bgcolor: 'rgba(255, 255, 255, 0.1)',
            }}>
              <Box sx={{
                width: `${progress}%`,
                height: '100%',
                bgcolor: 'primary.main',
                transition: 'width 1s linear'
              }} />
            </Box>
          )}

          {/* Zone de texte */}
          <Box 
            sx={{ 
              p: 3,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              minHeight: '100px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography
              variant="body1"
              align="center"
              sx={{
                color: '#fff',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                opacity: data.content?.text ? 1 : 0.5
              }}
            >
              {data.content?.text || 'No text'}
            </Typography>
          </Box>
        </Box>

        {/* Boutons d'action */}
        {!data.isPlaybackMode && (
          <Box sx={{ p: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<TextFieldsIcon />}
              onClick={() => setIsTextDialogOpen(true)}
              sx={{ 
                mb: 1,
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.8)',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Change Text
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setIsChoicesDialogOpen(true)}
              sx={{ 
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.8)',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Edit Choices
            </Button>
          </Box>
        )}

        {/* Zone des choix en mode lecture */}
        {data.isPlaybackMode && data.content?.choices && (
          <Box sx={{ p: 2 }}>
            {data.content.choices.map((choice) => (
              <Box 
                key={choice.id}
                sx={{ 
                  position: 'relative',
                  mb: 1
                }}
              >
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`button-handle-${choice.id}`}
                  style={{
                    position: 'absolute',
                    right: '-20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '12px',
                    height: '12px',
                    background: '#555',
                    border: '2px solid rgba(255, 255, 255, 0.8)',
                    cursor: 'crosshair'
                  }}
                />
                <Button
                  variant="contained"
                  onClick={() => data.onChoiceSelect?.(id, choice)}
                  fullWidth
                  sx={{ 
                    bgcolor: 'rgba(0, 0, 0, 0.6)',
                    color: 'white',
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.8)',
                    }
                  }}
                >
                  {choice.text}
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      {/* Dialog d'édition du texte */}
      <Dialog 
        open={isTextDialogOpen} 
        onClose={() => setIsTextDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Text</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={4}
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            fullWidth
            variant="outlined"
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            type="number"
            label="Duration (seconds)"
            value={editingDuration}
            onChange={(e) => setEditingDuration(Math.max(1, parseInt(e.target.value) || 5))}
            fullWidth
            variant="outlined"
            inputProps={{ min: 1, max: 30 }}
          />
        </DialogContent>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={() => setIsTextDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleTextChange}
            variant="contained" 
            color="primary"
          >
            Save
          </Button>
        </Box>
      </Dialog>

      {/* Dialog d'édition des choix */}
      <Dialog 
        open={isChoicesDialogOpen} 
        onClose={() => setIsChoicesDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Choices</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              value={newChoiceText}
              onChange={(e) => setNewChoiceText(e.target.value)}
              fullWidth
              variant="outlined"
              placeholder="New choice text"
              sx={{ mb: 1 }}
            />
            <Button
              onClick={() => {
                handleAddChoice(newChoiceText);
                setNewChoiceText('');
              }}
              variant="contained"
              color="primary"
              fullWidth
              disabled={!newChoiceText.trim()}
            >
              Add Choice
            </Button>
          </Box>

          <List>
            {data.content?.choices?.map((choice) => (
              <ListItem
                key={choice.id}
                sx={{
                  bgcolor: 'rgba(0, 0, 0, 0.05)',
                  mb: 1,
                  borderRadius: 1
                }}
              >
                {editingChoiceId === choice.id ? (
                  <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                    <TextField
                      value={editingChoiceText}
                      onChange={(e) => setEditingChoiceText(e.target.value)}
                      fullWidth
                      size="small"
                      autoFocus
                    />
                    <Button
                      onClick={() => handleEditChoice(choice)}
                      variant="contained"
                      size="small"
                    >
                      Save
                    </Button>
                  </Box>
                ) : (
                  <>
                    <ListItemText primary={choice.text} />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => {
                          setEditingChoiceId(choice.id);
                          setEditingChoiceText(choice.text);
                        }}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteChoice(choice.id)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </>
                )}
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => setIsChoicesDialogOpen(false)} color="primary">
            Done
          </Button>
        </Box>
      </Dialog>
    </div>
  );
}
