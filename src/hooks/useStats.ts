import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stats } from '../game/types';

const STATS_KEY = 'klondike_stats_v1';

export const useStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalGames: 0,
    completedGames: 0,
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
