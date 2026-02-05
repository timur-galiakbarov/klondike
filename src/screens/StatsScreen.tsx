import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stats } from '../game/types';
import { formatTime } from '../utils/time';
import { SecondaryButton } from '../components/Buttons';

export const StatsScreen = ({
  stats,
  onBack
}: {
  stats: Stats;
  onBack: () => void;
}) => {
  const times = stats.bestTimes.slice(0, 3);
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Мои результаты</Text>
      <View style={styles.cardPanel}>
        <Text style={styles.statLabel}>Всего пасьянсов</Text>
        <Text style={styles.statValue}>{stats.totalGames}</Text>
      </View>
      <View style={styles.cardPanel}>
        <Text style={styles.statLabel}>Завершено игр</Text>
        <Text style={styles.statValue}>{stats.completedGames}</Text>
      </View>
      <View style={styles.cardPanel}>
        <Text style={styles.statLabel}>Лучшее время</Text>
        {times.length === 0 ? (
          <Text style={styles.statValue}>—</Text>
        ) : (
          <Text style={styles.statValue}>{times.map(formatTime).join('  |  ')}</Text>
        )}
      </View>
      <SecondaryButton label="Выйти в меню" leadingIconName="arrow-back" onPress={onBack} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    color: '#f7f3e8',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 28
  },
  cardPanel: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    borderRadius: 18,
    marginBottom: 18,
    width: '100%'
  },
  statLabel: {
    color: '#b7b1a7',
    fontSize: 14,
    marginBottom: 6
  },
  statValue: {
    color: '#f7f3e8',
    fontSize: 22,
    fontWeight: '700'
  }
});
