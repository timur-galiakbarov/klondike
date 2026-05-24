import { useCallback } from 'react';
import { logEvent, getAnalytics } from '@react-native-firebase/analytics';
import Constants from 'expo-constants';
import AppMetrica from '@appmetrica/react-native-analytics';

const appMetricaKey = Constants.expoConfig?.extra?.appMetricaKey;
const isAppMetricaConfigured =
  typeof appMetricaKey === 'string' && appMetricaKey.trim().length > 0;

export const useAnalytics = () => {
  const sendAnalytics = useCallback(
    async (eventName: string, params?: Record<string, any>) => {
      // await firebaseAppReady;
      try {
        const analytics = getAnalytics();
        logEvent(analytics, eventName, params);
        if (isAppMetricaConfigured) {
          AppMetrica.reportEvent(eventName, params ?? {});
        }
        console.debug('[Analytics]', eventName, params ?? '');
      } catch (error) {
        console.warn('Analytics log failed', eventName, error);
      }
    },
    []
  );

  return { sendAnalytics };
};
