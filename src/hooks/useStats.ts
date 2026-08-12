import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stats } from '../game/types';

const STATS_KEY = 'klondike_stats_v1';

export const useStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalGames: 0,
    completedGames: 0,
    consecutiveWins: 0,
    consecutiveLosses: 0,
    lastPlayedAt: null,
    dailyWinStreak: 0,
    lastWinDate: null,
    bestTimes: [],
    bestMoves: [],
    bestResults: []
  });

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STATS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Stats>;
          const parsedBestResults = Array.isArray(parsed.bestResults) ? parsed.bestResults : [];
          setStats({
            totalGames: parsed.totalGames ?? 0,
            completedGames: parsed.completedGames ?? 0,
            consecutiveWins: parsed.consecutiveWins ?? 0,
            consecutiveLosses: parsed.consecutiveLosses ?? 0,
            lastPlayedAt: typeof parsed.lastPlayedAt === 'string' ? parsed.lastPlayedAt : null,
            dailyWinStreak: parsed.dailyWinStreak ?? 0,
            lastWinDate: typeof parsed.lastWinDate === 'string' ? parsed.lastWinDate : null,
            bestTimes: parsed.bestTimes ?? [],
            bestMoves: parsed.bestMoves ?? [],
            bestResults: parsedBestResults.slice(0, 10).map((result) => ({
              moves: typeof result.moves === 'number' ? result.moves : 0,
              seconds: typeof result.seconds === 'number' ? result.seconds : 0,
              usedHints: !!result.usedHints,
              undoCount: typeof result.undoCount === 'number' ? result.undoCount : 0
            }))
          });
        }
      } catch {
        // ignore read errors
      }
    };
    load();
  }, []);

  const save = useCallback((next: Stats) => {
    setStats(next);
    AsyncStorage.setItem(STATS_KEY, JSON.stringify(next)).catch(() => undefined);
  }, []);

  return { stats, save };
};
