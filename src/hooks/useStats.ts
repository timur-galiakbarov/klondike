import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stats } from '../game/types';

const STATS_KEY = 'klondike_stats_v1';

export const useStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalGames: 0,
    completedGames: 0,
    bestTimes: []
  });

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STATS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Stats>;
          setStats({
            totalGames: parsed.totalGames ?? 0,
            completedGames: parsed.completedGames ?? 0,
            bestTimes: parsed.bestTimes ?? []
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
