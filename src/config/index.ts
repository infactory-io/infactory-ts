// Add exports for future config files

export type Config = {
  api_key: string;
  base_url: string;
};
let config: Config | null = null;

export const getConfig = (throwIfMissing = false, reload = false): Config => {
  if (!config || reload) {
    config = {
      api_key: process.env.NF_API_KEY || '',
      base_url: process.env.NF_BASE_URL || 'https://api.infactory.ai',
    };
  }
  if ((!config || !config.api_key || !config.base_url) && throwIfMissing) {
    throw new Error(
      'Config not found or invalid, set NF_API_KEY and NF_BASE_URL environment variables',
    );
  }
  return config;
};
