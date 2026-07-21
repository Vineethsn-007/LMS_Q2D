import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEPLOYED_BACKEND_URL = 'https://skillforge-backend-uy0u.onrender.com';

// Default configuration for different environments
const getDefaultApiUrl = () => {
  // If explicitly set in app.json/expoConfig extra
  if (Constants.expoConfig?.extra?.apiUrl) {
    return Constants.expoConfig.extra.apiUrl;
  }

  // If running in production / standalone build, always use deployed backend
  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    return DEPLOYED_BACKEND_URL;
  }

  // Check Expo manifest debuggerHost to automatically derive LAN IP during local development
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:8000`;
    }
  }

  // Fallback to deployed backend if not local dev
  return DEPLOYED_BACKEND_URL;
};

export const API_BASE_URL = getDefaultApiUrl();
export const APP_NAME = 'SkillForge LMS';
