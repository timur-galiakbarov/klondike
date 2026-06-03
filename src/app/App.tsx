import React, { useEffect, useState } from 'react';
import {
  AppState,
  InteractionManager,
  Platform,
  StatusBar,
  StyleSheet
} from 'react-native';
import Constants from 'expo-constants';
import AppMetrica from '@appmetrica/react-native-analytics';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MobileAds } from 'yandex-mobile-ads';
import { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { useStats } from '../hooks/useStats';
import { useSettings } from '../hooks/useSettings';
import { useRatingPrompt } from '../hooks/useRatingPrompt';
import { HomeScreen } from '../screens/HomeScreen';
import { GameScreen, SavedGame } from '../screens/GameScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { setLocale } from '../i18n';

const toLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDateDistanceInDays = (fromDateKey: string | null, toDateKey: string) => {
  if (!fromDateKey) return null;

  const fromTime = new Date(`${fromDateKey}T00:00:00`).getTime();
  const toTime = new Date(`${toDateKey}T00:00:00`).getTime();
  if (!Number.isFinite(fromTime) || !Number.isFinite(toTime)) return null;

  return Math.round((toTime - fromTime) / 86_400_000);
};

const getNextDailyWinStreak = (currentStreak: number, lastWinDate: string | null) => {
  const todayKey = toLocalDateKey(new Date());
  const distanceInDays = getDateDistanceInDays(lastWinDate, todayKey);

  if (distanceInDays === 0) {
    return { dailyWinStreak: currentStreak, lastWinDate: todayKey };
  }

  if (distanceInDays === 1) {
    return { dailyWinStreak: currentStreak + 1, lastWinDate: todayKey };
  }

  return { dailyWinStreak: 1, lastWinDate: todayKey };
};

const getActiveDailyWinStreak = (currentStreak: number, lastWinDate: string | null) => {
  const todayKey = toLocalDateKey(new Date());
  const distanceInDays = getDateDistanceInDays(lastWinDate, todayKey);
  return distanceInDays !== null && distanceInDays <= 1 ? currentStreak : 0;
};

const appMetricaKey = Constants.expoConfig?.extra?.appMetricaKey;

export const App = () => {
  const DEFAULT_ADV_REFRESH_TIME_MS = 60_000;
  const [screen, setScreen] = useState<'home' | 'game' | 'stats' | 'settings'>(
    'home'
  );
  const { stats, save } = useStats();
  const { settings, save: saveSettings } = useSettings();
  const { requestRatingAfterWin } = useRatingPrompt();
  const [gameKey, setGameKey] = useState(0);
  const [savedGame, setSavedGame] = useState<SavedGame | null>(null);
  const [advRefreshTimeMs, setAdvRefreshTimeMs] = useState(DEFAULT_ADV_REFRESH_TIME_MS);

  setLocale(settings.locale);

  useEffect(() => {
    const waitForActiveAppState = () => new Promise<void>((resolve) => {
      if (AppState.currentState === 'active') {
        resolve();
        return;
      }

      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          subscription.remove();
          resolve();
        }
      });
    });

    const initTracking = async () => {
      try {
        if (Platform.OS === 'ios') {
          await waitForActiveAppState();
          await new Promise<void>((resolve) => {
            InteractionManager.runAfterInteractions(() => resolve());
          });
          await new Promise((resolve) => setTimeout(resolve, 800));

          const { status } = await getTrackingPermissionsAsync();
          if (status === 'undetermined') {
            await requestTrackingPermissionsAsync();
          }
        }

        if (typeof appMetricaKey === 'string' && appMetricaKey.trim().length > 0) {
          AppMetrica.activate({
            apiKey: appMetricaKey,
            sessionTimeout: 120,
            logs: true
          });
        } else {
          console.warn('AppMetrica key is not configured');
        }

        await MobileAds.initialize();
      } catch (error) {
        // Tracking SDK init should never crash app startup.
        console.warn('Tracking SDK initialize failed', error);
      }
    };

    const loadAppState = async () => {
      try {
        const response = await fetch('https://moneyplanner.app/api/app-state-klondike');
        if (!response.ok) {
          setAdvRefreshTimeMs(DEFAULT_ADV_REFRESH_TIME_MS);
          return;
        }
        const data = (await response.json()) as {
          adv?: { advRefreshTime?: number };
        };
        const nextMs = data?.adv?.advRefreshTime;
        setAdvRefreshTimeMs(
          typeof nextMs === 'number' && Number.isFinite(nextMs) && nextMs > 0
            ? nextMs
            : DEFAULT_ADV_REFRESH_TIME_MS
        );
      } catch {
        setAdvRefreshTimeMs(DEFAULT_ADV_REFRESH_TIME_MS);
      }
    };

    initTracking().catch((error) => {
      console.warn('Unexpected initTracking failure', error);
    });
    loadAppState();
  }, []);

  const handleNewGame = () => {
    save({ ...stats, totalGames: stats.totalGames + 1 });
    setSavedGame(null);
    setGameKey((prev) => prev + 1);
    setScreen('game');
  };

  const handleContinueGame = () => {
    if (!savedGame) return;
    setGameKey((prev) => prev + 1);
    setScreen('game');
  };

  const handleGameComplete = ({
    seconds,
    moves,
    usedHints,
    undoCount
  }: {
    seconds: number;
    moves: number;
    usedHints: boolean;
    undoCount: number;
  }) => {
    const bestTimes = [...stats.bestTimes, seconds].sort((a, b) => a - b).slice(0, 3);
    const bestMoves = [...stats.bestMoves, moves].sort((a, b) => a - b).slice(0, 3);
    const bestResults = [
      ...stats.bestResults,
      { moves, seconds, usedHints, undoCount }
    ]
      .sort((a, b) => {
        if (a.seconds !== b.seconds) return a.seconds - b.seconds;
        if (a.moves !== b.moves) return a.moves - b.moves;
        return a.undoCount - b.undoCount;
      })
      .slice(0, 10);
    const dailyWinStreak = getNextDailyWinStreak(stats.dailyWinStreak, stats.lastWinDate);
    save({
      ...stats,
      completedGames: stats.completedGames + 1,
      ...dailyWinStreak,
      bestTimes,
      bestMoves,
      bestResults
    });
    requestRatingAfterWin().catch(() => undefined);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" />
        {screen === 'home' && (
          <HomeScreen
            onStart={handleNewGame}
            onContinue={handleContinueGame}
            hasSaved={!!savedGame}
            dailyWinStreak={getActiveDailyWinStreak(stats.dailyWinStreak, stats.lastWinDate)}
            onSettings={() => setScreen('settings')}
            onStats={() => setScreen('stats')}
          />
        )}
        {screen === 'game' && (
          <GameScreen
            key={gameKey}
            onBack={() => setScreen('home')}
            onOpenStats={() => setScreen('stats')}
            onComplete={handleGameComplete}
            settings={settings}
            onChangeSettings={saveSettings}
            advRefreshTimeMs={advRefreshTimeMs}
            resume={savedGame}
            onSaveGame={setSavedGame}
            onClearSaved={() => setSavedGame(null)}
          />
        )}
        {screen === 'stats' && (
          <StatsScreen stats={stats} onBack={() => setScreen('home')} />
        )}
        {screen === 'settings' && (
          <SettingsScreen
            settings={settings}
            onChangeSettings={saveSettings}
            onBack={() => setScreen('home')}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0f2a1f'
  }
});

export default App;
