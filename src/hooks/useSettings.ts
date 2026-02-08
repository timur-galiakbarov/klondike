import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type GameSettings = {
  drawCount: 1 | 3;
  hapticsEnabled: boolean;
};

const SETTINGS_KEY = 'klondike_settings_v1';

const defaultSettings: GameSettings = { drawCount: 1, hapticsEnabled: true };

export const useSettings = () => {
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<GameSettings>;
          setSettings({
            drawCount: parsed.drawCount === 3 ? 3 : 1,
            hapticsEnabled: parsed.hapticsEnabled !== false
          });
        }
      } catch {
        // ignore read errors
      }
    };
    load();
  }, []);

  const save = useCallback((next: GameSettings) => {
    setSettings(next);
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(() => undefined);
  }, []);

  return { settings, save };
};
