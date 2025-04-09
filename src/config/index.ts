// Add exports for future config files

export type Config = {
  apiKey: string;
  baseUrl: string;
};
let config: Config | null = null;

export const getConfig = (throwIfMissing = false, reload = false): Config => {
  if (!config || reload) {
    config = {
      apiKey: process.env.NF_API_KEY || '',
      baseUrl: process.env.NF_BASE_URL || 'https://api.infactory.ai',
    };
  }
  if ((!config || !config.apiKey || !config.baseUrl) && throwIfMissing) {
    throw new Error(
      'Config not found or invalid, set NF_API_KEY and NF_BASE_URL environment variables',
    );
  }
  return config;
};
