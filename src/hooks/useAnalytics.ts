import { useCallback } from 'react';
import { logEvent, getAnalytics } from '@react-native-firebase/analytics';

export const useAnalytics = () => {
  const sendAnalytics = useCallback(
    async (eventName: string, params?: Record<string, any>) => {
      // await firebaseAppReady;
      try {
        const analytics = getAnalytics();
        logEvent(analytics, eventName, params);
        console.debug('[Analytics]', eventName, params ?? '');
      } catch (error) {
        console.warn('Analytics log failed', eventName, error);
      }
    },
    []
  );

  return { sendAnalytics };
};
