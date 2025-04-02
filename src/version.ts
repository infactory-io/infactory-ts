// This file is automatically generated during build
export const VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0';
export const BUILD_NUMBER =
  process.env.NEXT_PUBLIC_BUILD_NUMBER || 'development';
export const BUILD_TIME =
  process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'redacted';
export const SERVER_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const getVersionInfo = () => ({
  version: VERSION,
  buildNumber: BUILD_NUMBER,
  buildTime: BUILD_TIME,
  appUrl: APP_URL,
  apiBaseUrl: SERVER_BASE_URL
});

export const isLocalDeployment = () => {
  // return SERVER_BASE_URL === 'http://localhost:8000';
  return false;
};
