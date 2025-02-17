import OpenAI from 'openai';

/**
 * Teste la connexion à l'API OpenAI avec un appel simple
 * @param apiKey La clé API à tester
 */
export async function testOpenAIConnection(apiKey: string): Promise<{
  isValid: boolean;
  error?: string;
  models?: string[];
}> {
  console.log('Testing OpenAI connection...');
  console.log('API Key length:', apiKey.length);
  console.log('API Key prefix:', apiKey.substring(0, 10) + '...');

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
    baseURL: 'https://api.openai.com/v1'
  });

  try {
    // Test simple avec une complétion de chat
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Test connection"
        }
      ]
    });

    console.log('OpenAI response:', completion);
    return {
      isValid: true,
      models: ['gpt-3.5-turbo'] // Liste basique pour commencer
    };
  } catch (error) {
    console.error('OpenAI connection error:', {
      name: error.name,
      message: error.message,
      status: error.status,
      response: error.response
    });

    return {
      isValid: false,
      error: `${error.name}: ${error.message}`
    };
  }
}
