import { config } from 'dotenv';

// Load .env.test first, fall back to .env
config({ path: '.env.test', override: true });
config({ override: false }); // .env
