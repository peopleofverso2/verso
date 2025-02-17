import OpenAI from 'openai';

interface ApiKeyValidationResult {
  isValid: boolean;
  availableModels: string[];
  error?: string;
  permissions?: {
    canUseGpt4: boolean;
    canUseVision: boolean;
    canUseGpt35: boolean;
  };
}

/**
 * Teste la validité et les permissions d'une clé API OpenAI
 */
export async function validateApiKey(apiKey: string): Promise<ApiKeyValidationResult> {
  console.log('Testing OpenAI API key:', apiKey.substring(0, 10) + '...');
  
  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });

  try {
    // Liste tous les modèles disponibles
    console.log('Fetching available models...');
    const models = await openai.models.list();
    const availableModels = models.data.map(model => model.id);
    console.log('Available models:', availableModels);

    // Vérifie les permissions spécifiques
    const permissions = {
      canUseGpt4: availableModels.some(model => model.includes('gpt-4')),
      canUseVision: availableModels.some(model => model.includes('vision')),
      canUseGpt35: availableModels.some(model => model.includes('gpt-3.5'))
    };

    console.log('API permissions:', permissions);

    // Teste une requête simple avec GPT-3.5
    if (permissions.canUseGpt35) {
      console.log('Testing GPT-3.5 access...');
      await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Test" }]
      });
    }

    return {
      isValid: true,
      availableModels,
      permissions
    };
  } catch (error) {
    console.error('API key validation error:', error);
    return {
      isValid: false,
      availableModels: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      permissions: {
        canUseGpt4: false,
        canUseVision: false,
        canUseGpt35: false
      }
    };
  }
}
