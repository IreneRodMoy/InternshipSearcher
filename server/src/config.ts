import path from 'node:path';

const env = process.env;
const isProduction = env.NODE_ENV === 'production';

function required(name: string, devFallback: string): string {
  const value = env[name];
  if (value) return value;
  if (isProduction) throw new Error(`Missing required environment variable ${name}`);
  return devFallback;
}

export const config = {
  isProduction,
  port: Number(env.PORT ?? 3000),
  dataDir: path.resolve(env.DATA_DIR ?? './data'),
  password: required('APP_PASSWORD', 'dev'),
  sessionSecret: required('SESSION_SECRET', 'dev-secret-change-me'),
  linkedinEnabled: env.LINKEDIN_ENABLED !== 'false',
  jsearchKey: env.JSEARCH_API_KEY || undefined,
  adzuna: env.ADZUNA_APP_ID && env.ADZUNA_APP_KEY
    ? { appId: env.ADZUNA_APP_ID, appKey: env.ADZUNA_APP_KEY }
    : undefined,
  ntfyTopic: env.NTFY_TOPIC || undefined,
  ntfyServer: env.NTFY_SERVER ?? 'https://ntfy.sh',
  publicUrl: env.PUBLIC_URL,
};
