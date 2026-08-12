import React, { useEffect, useRef, useState } from 'react';
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
import { cloneState } from '../game/utils';
import { dealFromPlan, selectDealPlan } from '../game/deals';
import { GameState, Stats } from '../game/types';

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
  const statsRef = useRef(stats);
  const { settings, save: saveSettings } = useSettings();
  const { requestRatingAfterWin } = useRatingPrompt();
  const [gameKey, setGameKey] = useState(0);
  const [savedGame, setSavedGame] = useState<SavedGame | null>(null);
  const [initialGame, setInitialGame] = useState<GameState | null>(null);
  const [advRefreshTimeMs, setAdvRefreshTimeMs] = useState(DEFAULT_ADV_REFRESH_TIME_MS);
  const [adaptiveDealsEnabled, setAdaptiveDealsEnabled] = useState(true);

  setLocale(settings.locale);
  statsRef.current = stats;

  const saveStats = (next: Stats) => {
    statsRef.current = next;
    save(next);
  };

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
          features?: { adaptiveDeals?: boolean };
        };
        const nextMs = data?.adv?.advRefreshTime;
        setAdvRefreshTimeMs(
          typeof nextMs === 'number' && Number.isFinite(nextMs) && nextMs > 0
            ? nextMs
            : DEFAULT_ADV_REFRESH_TIME_MS
        );
        setAdaptiveDealsEnabled(data?.features?.adaptiveDeals !== false);
      } catch {
        setAdvRefreshTimeMs(DEFAULT_ADV_REFRESH_TIME_MS);
      }
    };

    initTracking().catch((error) => {
      console.warn('Unexpected initTracking failure', error);
    });
    loadAppState();
  }, []);

  const createNextGame = (countAsLoss: boolean) => {
    const current = statsRef.current;
    const lastPlayedAt = current.lastPlayedAt ? new Date(current.lastPlayedAt).getTime() : Number.NaN;
    const isLongReturn = Number.isFinite(lastPlayedAt) && Date.now() - lastPlayedAt >= 7 * 86_400_000;
    const returnAdjustedStats: Stats = isLongReturn
      ? { ...current, consecutiveWins: 0, consecutiveLosses: 0 }
      : current;
    const selectionStats: Stats = countAsLoss
      ? {
          ...returnAdjustedStats,
          consecutiveWins: 0,
          consecutiveLosses: returnAdjustedStats.consecutiveLosses + 1
        }
      : returnAdjustedStats;
    const now = Date.now();
    const plan = selectDealPlan(selectionStats, now);
    const nextGame = dealFromPlan(
      adaptiveDealsEnabled ? plan : { ...plan, guaranteedSolvable: false },
      settings.drawCount
    );
    saveStats({
      ...selectionStats,
      totalGames: selectionStats.totalGames + 1,
      lastPlayedAt: new Date(now).toISOString()
    });
    return nextGame;
  };

  const handleNewGame = () => {
    const abandoned = !!savedGame &&
      (savedGame.history.length >= 3 || savedGame.seconds >= 30);
    setInitialGame(createNextGame(abandoned));
    setSavedGame(null);
    setGameKey((prev) => prev + 1);
    setScreen('game');
  };

  const handleContinueGame = () => {
    if (!savedGame) return;
    setInitialGame(cloneState(savedGame.initialState));
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
    const current = statsRef.current;
    const bestTimes = [...current.bestTimes, seconds].sort((a, b) => a - b).slice(0, 3);
    const bestMoves = [...current.bestMoves, moves].sort((a, b) => a - b).slice(0, 3);
    const bestResults = [
      ...current.bestResults,
      { moves, seconds, usedHints, undoCount }
    ]
      .sort((a, b) => {
        if (a.seconds !== b.seconds) return a.seconds - b.seconds;
        if (a.moves !== b.moves) return a.moves - b.moves;
        return a.undoCount - b.undoCount;
      })
      .slice(0, 10);
    const dailyWinStreak = getNextDailyWinStreak(current.dailyWinStreak, current.lastWinDate);
    saveStats({
      ...current,
      completedGames: current.completedGames + 1,
      consecutiveWins: current.consecutiveWins + 1,
      consecutiveLosses: 0,
      ...dailyWinStreak,
      bestTimes,
      bestMoves,
      bestResults
    });
    requestRatingAfterWin().catch(() => undefined);
  };

  const handleRequestNewGame = ({ abandoned }: { abandoned: boolean }) => {
    const nextGame = createNextGame(abandoned);
    setInitialGame(nextGame);
    setSavedGame(null);
    return nextGame;
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
        {screen === 'game' && initialGame && (
          <GameScreen
            key={gameKey}
            onBack={() => setScreen('home')}
            onOpenStats={() => setScreen('stats')}
            onComplete={handleGameComplete}
            settings={settings}
            onChangeSettings={saveSettings}
            advRefreshTimeMs={advRefreshTimeMs}
            initialGame={initialGame}
            resume={savedGame}
            onRequestNewGame={handleRequestNewGame}
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
