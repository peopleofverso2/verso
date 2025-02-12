import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Stack,
} from '@mui/material';

interface TimerSettingsProps {
  open: boolean;
  onClose: () => void;
  timer: {
    duration: number;
    autoTransition: boolean;
    loop: boolean;
  };
  onSave: (timer: { duration: number; autoTransition: boolean; loop: boolean }) => void;
}

const TimerSettings: React.FC<TimerSettingsProps> = ({
  open,
  onClose,
  timer,
  onSave,
}) => {
  const [duration, setDuration] = React.useState(timer.duration);
  const [autoTransition, setAutoTransition] = React.useState(timer.autoTransition);
  const [loop, setLoop] = React.useState(timer.loop);

  const handleSave = () => {
    onSave({
      duration: Math.max(0.1, duration),
      autoTransition,
      loop,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Timer Settings</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Duration (seconds)"
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            inputProps={{ min: 0.1, step: 0.1 }}
            fullWidth
          />
          <FormControlLabel
            control={
              <Switch
                checked={autoTransition}
                onChange={(e) => setAutoTransition(e.target.checked)}
              />
            }
            label="Auto transition to next node"
          />
          <FormControlLabel
            control={
              <Switch
                checked={loop}
                onChange={(e) => setLoop(e.target.checked)}
              />
            }
            label="Loop timer"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TimerSettings;
