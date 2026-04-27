import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

const RATE_PROMPT_KEY = 'klondike_rate_prompt_v1';
const MAX_PROMPTS = 3;

type RatePromptState = {
  installedOn: string;
  promptsShown: number;
  lastPromptOn?: string;
};

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const loadState = async (): Promise<RatePromptState | null> => {
  try {
    const raw = await AsyncStorage.getItem(RATE_PROMPT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RatePromptState>;
    if (!parsed.installedOn) return null;
    return {
      installedOn: parsed.installedOn,
      promptsShown: parsed.promptsShown ?? 0,
      lastPromptOn: parsed.lastPromptOn
    };
  } catch {
    return null;
  }
};

const saveState = async (state: RatePromptState) => {
  try {
    await AsyncStorage.setItem(RATE_PROMPT_KEY, JSON.stringify(state));
  } catch {
    // ignore write errors
  }
};

export const useRatingPrompt = () => {
  const requestRatingAfterWin = useCallback(async () => {
    const today = getTodayKey();
    const existingState = await loadState();

    if (!existingState) {
      await saveState({
        installedOn: today,
        promptsShown: 0
      });
      return;
    }

    if (existingState.installedOn === today) return;
    if (existingState.promptsShown >= MAX_PROMPTS) return;
    if (existingState.lastPromptOn === today) return;

    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) return;

    await saveState({
      ...existingState,
      promptsShown: existingState.promptsShown + 1,
      lastPromptOn: today
    });

    await StoreReview.requestReview();
  }, []);

  return { requestRatingAfterWin };
};
