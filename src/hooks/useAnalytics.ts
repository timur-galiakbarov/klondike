import { useCallback } from 'react';
import analytics from '@react-native-firebase/analytics';
import { firebase } from '@react-native-firebase/app';

export const useAnalytics = () => {
  const ensureApp = () => {
    if (firebase.apps.length === 0) {
      firebase.initializeApp();
    }
  };

  const sendAnalytics = useCallback(
    async (eventName: string, params?: Record<string, any>) => {
      ensureApp();
      try {
        await analytics().logEvent(eventName, params);
        console.debug('[Analytics]', eventName, params ?? '');
      } catch (error) {
        console.warn('Analytics log failed', eventName, error);
      }
    },
    []
  );

  return { sendAnalytics };
};
