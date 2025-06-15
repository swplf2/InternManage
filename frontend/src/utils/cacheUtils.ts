import { clearCache } from '../services/api';

// Utility để clear cache khi cần
export const clearApiCache = () => {
  clearCache();
  console.log('API cache cleared');
};

// Hook để auto clear cache khi user thay đổi
export const useApiCache = () => {
  return {
    clearCache: clearApiCache
  };
};
