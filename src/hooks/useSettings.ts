import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CardBackTheme,
  DEFAULT_CARD_BACK_THEME,
  isCardBackTheme
} from '../game/cardBackThemes';
import { LocaleSetting } from '../i18n';

export type GameSettings = {
  drawCount: 1 | 3;
  hapticsEnabled: boolean;
  handOrientation: 'left' | 'right';
  cardBackTheme: CardBackTheme;
  hasUsedOpenCardFeature: boolean;
  locale: LocaleSetting;
};

const SETTINGS_KEY = 'klondike_settings_v1';

const defaultSettings: GameSettings = {
  drawCount: 1,
  hapticsEnabled: true,
  handOrientation: 'right',
  cardBackTheme: DEFAULT_CARD_BACK_THEME,
  hasUsedOpenCardFeature: false,
  locale: 'system'
};

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
            hapticsEnabled: parsed.hapticsEnabled !== false,
            handOrientation: parsed.handOrientation === 'left' ? 'left' : 'right',
            cardBackTheme: isCardBackTheme(parsed.cardBackTheme)
              ? parsed.cardBackTheme
              : DEFAULT_CARD_BACK_THEME,
            hasUsedOpenCardFeature: !!parsed.hasUsedOpenCardFeature,
            locale:
              parsed.locale === 'en' ||
              parsed.locale === 'fr' ||
              parsed.locale === 'it' ||
              parsed.locale === 'pt' ||
              parsed.locale === 'nl' ||
              parsed.locale === 'pl' ||
              parsed.locale === 'ru' ||
              parsed.locale === 'system'
                ? parsed.locale
                : 'system'
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
