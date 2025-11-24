import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve server root (one level up from config)
const projectRoot = path.resolve(__dirname, '..');

// Load .env from server directory to match original behavior
// Set override: true so .env values take precedence over existing env vars
dotenv.config({ path: path.join(projectRoot, '.env'), override: true });

export const env = {
  PORT: process.env.PORT || 5000,
  // Prefer Atlas-style MONGODB_URI; fall back to legacy MONGO_URL if present
  MONGO_URI: process.env.MONGODB_URI || process.env.MONGO_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  NODE_ENV: process.env.NODE_ENV || 'production',
};

export const paths = {
  serverDir: __dirname,
  projectRoot,
  // Serve static frontend from ./frontend at the project root
  // projectRoot is server/, so go up one level to get to project root, then into frontend
  clientDir: path.resolve(projectRoot, '..', 'frontend'),
};

export default env;