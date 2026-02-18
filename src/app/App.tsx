import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MobileAds } from 'yandex-mobile-ads';
import { useStats } from '../hooks/useStats';
import { useSettings } from '../hooks/useSettings';
import { HomeScreen } from '../screens/HomeScreen';
import { GameScreen, SavedGame } from '../screens/GameScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

export const App = () => {
  const [screen, setScreen] = useState<'home' | 'game' | 'stats' | 'settings'>(
    'home'
  );
  const { stats, save } = useStats();
  const { settings, save: saveSettings } = useSettings();
  const [gameKey, setGameKey] = useState(0);
  const [savedGame, setSavedGame] = useState<SavedGame | null>(null);

  useEffect(() => {
    MobileAds.initialize();
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

  const handleGameComplete = (seconds: number) => {
    const bestTimes = [...stats.bestTimes, seconds].sort((a, b) => a - b).slice(0, 3);
    save({
      ...stats,
      completedGames: stats.completedGames + 1,
      bestTimes
    });
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
            onSettings={() => setScreen('settings')}
            onStats={() => setScreen('stats')}
          />
        )}
        {screen === 'game' && (
          <GameScreen
            key={gameKey}
            onBack={() => setScreen('home')}
            onComplete={handleGameComplete}
            settings={settings}
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
