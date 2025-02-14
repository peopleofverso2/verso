import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  IconButton,
  AppBar,
  Toolbar,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { configService, AppConfig, APIConfig } from '../../services/configService';
import { useAuth } from '../../contexts/AuthContext';

export const ConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const savedConfig = await configService.getConfig();
      if (savedConfig) {
        setConfig(savedConfig);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      showSnackbar('Error loading configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setError(null);
      await configService.saveConfig(config);
      setSuccess('Configuration saved successfully');
      showSnackbar('Configuration saved successfully', 'success');
    } catch (error) {
      console.error('Error saving config:', error);
      setError('Failed to save configuration');
      showSnackbar('Error saving configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestApi = async (apiName: keyof APIConfig) => {
    if (!config?.apis[apiName]?.apiKey) return;

    try {
      const result = await configService.testAPIKey(apiName, config.apis[apiName]?.apiKey || '');
      setTestResults(prev => ({
        ...prev,
        [apiName]: result,
      }));
      setSuccess(result ? `${apiName} API key is valid` : `${apiName} API key is invalid`);
      showSnackbar(result ? `${apiName} API key is valid` : `${apiName} API key is invalid`, result ? 'success' : 'error');
    } catch {
      setError(`Failed to test ${apiName} API key`);
      showSnackbar(`Failed to test ${apiName} API key`, 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (!user) {
    return (
      <Box p={3}>
        <Alert severity="warning">Please sign in to access settings</Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/')}
            aria-label="back"
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Settings
          </Typography>
          <Button color="primary" variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              API Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configure your API keys and settings for various services.
            </Typography>
          </Box>

          {/* YouTube Section */}
          <Box sx={{ mb: 4 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config?.apis.youtube?.enabled || false}
                  onChange={handleAPIToggle('youtube')}
                />
              }
              label="Enable YouTube"
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="YouTube API Key"
                type="password"
                value={config?.apis.youtube?.apiKey || ''}
                onChange={handleAPIKeyChange('youtube')}
                disabled={!config?.apis.youtube?.enabled}
              />
              <Button
                variant="outlined"
                onClick={() => handleTestApi('youtube')}
                disabled={!config?.apis.youtube?.enabled}
              >
                Test
              </Button>
            </Box>
          </Box>

          {/* OpenAI Section */}
          <Box sx={{ mb: 4 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config?.apis.openai?.enabled || false}
                  onChange={handleAPIToggle('openai')}
                />
              }
              label="Enable OpenAI"
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="OpenAI API Key"
                type="password"
                value={config?.apis.openai?.apiKey || ''}
                onChange={handleAPIKeyChange('openai')}
                disabled={!config?.apis.openai?.enabled}
              />
              <Button
                variant="outlined"
                onClick={() => handleTestApi('openai')}
                disabled={!config?.apis.openai?.enabled}
              >
                Test
              </Button>
            </Box>
          </Box>

          {/* Meta Section */}
          <Box sx={{ mb: 4 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config?.apis.meta?.enabled || false}
                  onChange={handleAPIToggle('meta')}
                />
              }
              label="Enable Meta"
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Meta API Key"
                type="password"
                value={config?.apis.meta?.apiKey || ''}
                onChange={handleAPIKeyChange('meta')}
                disabled={!config?.apis.meta?.enabled}
              />
              <Button
                variant="outlined"
                onClick={() => handleTestApi('meta')}
                disabled={!config?.apis.meta?.enabled}
              >
                Test
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const handleAPIToggle = (api: keyof APIConfig) => async (event: React.ChangeEvent<HTMLInputElement>) => {
  if (!config) return;

  const newConfig = {
    ...config,
    apis: {
      ...config.apis,
      [api]: {
        ...config.apis[api],
        enabled: event.target.checked,
      },
    },
  };
  setConfig(newConfig);
};

const handleAPIKeyChange = (api: keyof APIConfig) => (event: React.ChangeEvent<HTMLInputElement>) => {
  if (!config) return;

  const newConfig = {
    ...config,
    apis: {
      ...config.apis,
      [api]: {
        ...config.apis[api],
        apiKey: event.target.value,
      },
    },
  };
  setConfig(newConfig);
};
