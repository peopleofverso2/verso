import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { configService, AppConfig, APIConfig } from '../../services/configService';
import { useAuth } from '../../contexts/AuthContext';

export const ConfigPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const config = await configService.getConfig();
      setConfig(config);
    } catch (error) {
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
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

  const handleStorageTypeChange = (event: any) => {
    if (!config) return;

    const newConfig = {
      ...config,
      storage: {
        ...config.storage,
        type: event.target.value,
      },
    };
    setConfig(newConfig);
  };

  const testAPIKey = async (api: keyof APIConfig) => {
    if (!config?.apis[api]?.apiKey) return;

    try {
      const result = await configService.testAPIKey(api, config.apis[api]?.apiKey || '');
      setTestResults(prev => ({
        ...prev,
        [api]: result,
      }));
      setSuccess(result ? `${api} API key is valid` : `${api} API key is invalid`);
    } catch {
      setError(`Failed to test ${api} API key`);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setError(null);
      await configService.saveConfig(config);
      setSuccess('Configuration saved successfully');
    } catch (error) {
      setError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <Box p={3}>
        <Alert severity="warning">Please sign in to access settings</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/')}
            aria-label="retour"
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div">
            Configuration
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            <Typography variant="h4" gutterBottom>
              Settings
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Storage Configuration
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Storage Type</InputLabel>
                  <Select
                    value={config?.storage.type || 'local'}
                    onChange={handleStorageTypeChange}
                    label="Storage Type"
                  >
                    <MenuItem value="local">Local Storage</MenuItem>
                    <MenuItem value="remote">Remote Storage</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  API Configuration
                </Typography>

                {/* YouTube API */}
                <Box mb={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config?.apis.youtube?.enabled || false}
                        onChange={handleAPIToggle('youtube')}
                      />
                    }
                    label="Enable YouTube API"
                  />
                  {config?.apis.youtube?.enabled && (
                    <Box mt={2}>
                      <TextField
                        fullWidth
                        label="YouTube API Key"
                        type="password"
                        value={config?.apis.youtube?.apiKey || ''}
                        onChange={handleAPIKeyChange('youtube')}
                        sx={{ mb: 1 }}
                      />
                      <Button
                        variant="outlined"
                        onClick={() => testAPIKey('youtube')}
                        color={testResults.youtube ? 'success' : 'primary'}
                      >
                        Test Key
                      </Button>
                    </Box>
                  )}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* OpenAI API */}
                <Box mb={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config?.apis.openai?.enabled || false}
                        onChange={handleAPIToggle('openai')}
                      />
                    }
                    label="Enable OpenAI API"
                  />
                  {config?.apis.openai?.enabled && (
                    <Box mt={2}>
                      <TextField
                        fullWidth
                        label="OpenAI API Key"
                        type="password"
                        value={config?.apis.openai?.apiKey || ''}
                        onChange={handleAPIKeyChange('openai')}
                        sx={{ mb: 1 }}
                      />
                      <Button
                        variant="outlined"
                        onClick={() => testAPIKey('openai')}
                        color={testResults.openai ? 'success' : 'primary'}
                      >
                        Test Key
                      </Button>
                    </Box>
                  )}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Meta API */}
                <Box mb={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config?.apis.meta?.enabled || false}
                        onChange={handleAPIToggle('meta')}
                      />
                    }
                    label="Enable Meta API"
                  />
                  {config?.apis.meta?.enabled && (
                    <Box mt={2}>
                      <TextField
                        fullWidth
                        label="Meta API Key"
                        type="password"
                        value={config?.apis.meta?.apiKey || ''}
                        onChange={handleAPIKeyChange('meta')}
                        sx={{ mb: 1 }}
                      />
                      <Button
                        variant="outlined"
                        onClick={() => testAPIKey('meta')}
                        color={testResults.meta ? 'success' : 'primary'}
                      >
                        Test Key
                      </Button>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>

            <Box mt={3} display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                startIcon={saving && <CircularProgress size={20} />}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};
