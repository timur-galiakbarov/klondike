import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stats } from '../game/types';
import { formatTime } from '../utils/time';
import { SecondaryButton } from '../components/Buttons';
import { t } from '../i18n';

export const StatsScreen = ({
  stats,
  onBack
}: {
  stats: Stats;
  onBack: () => void;
}) => {
  const bestTime = stats.bestTimes.length > 0 ? stats.bestTimes[0] : null;
  const bestMoves = stats.bestMoves.length > 0 ? stats.bestMoves[0] : null;
  const bestResults = stats.bestResults.slice(0, 10);
  return (
    <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{t('myResults')}</Text>
      <View style={styles.statsGridRow}>
        <View style={[styles.cardPanel, styles.halfCard]}>
          <Text style={styles.statLabel}>{t('totalGames')}</Text>
          <Text style={styles.statValue}>{stats.totalGames}</Text>
        </View>
        <View style={[styles.cardPanel, styles.halfCard]}>
          <Text style={styles.statLabel}>{t('completedGames')}</Text>
          <Text style={styles.statValue}>{stats.completedGames}</Text>
        </View>
      </View>
      <View style={styles.statsGridRow}>
        <View style={[styles.cardPanel, styles.halfCard]}>
          <Text style={styles.statLabel}>{t('bestMoves')}</Text>
          {bestMoves === null ? (
            <Text style={styles.statValue}>—</Text>
          ) : (
            <Text style={styles.statValue}>{bestMoves}</Text>
          )}
        </View>
        <View style={[styles.cardPanel, styles.halfCard]}>
          <Text style={styles.statLabel}>{t('bestTime')}</Text>
          {bestTime === null ? (
            <Text style={styles.statValue}>—</Text>
          ) : (
            <Text style={styles.statValue}>{formatTime(bestTime)}</Text>
          )}
        </View>
      </View>
      <View style={styles.cardPanel}>
        <Text style={styles.statLabel}>{t('topGamesByTime')}</Text>
        <View style={styles.tableHead}>
          <Text style={[styles.tableHeadCell, styles.colNum]}>№</Text>
          <Text style={[styles.tableHeadCell, styles.colMoves]}>{t('movesShort')}</Text>
          <Text style={[styles.tableHeadCell, styles.colTime]}>{t('time')}</Text>
          <Text style={[styles.tableHeadCell, styles.colHints]}>{t('hints')}</Text>
          <Text style={[styles.tableHeadCell, styles.colUndo]}>{t('undoPlural')}</Text>
        </View>
        {bestResults.length === 0 ? (
          <Text style={styles.statValue}>—</Text>
        ) : (
          bestResults.map((result, index) => (
            <View key={`${result.moves}-${result.seconds}-${index}`} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colNum]}>{index + 1}</Text>
              <Text style={[styles.tableCell, styles.colMoves]}>{result.moves}</Text>
              <Text style={[styles.tableCell, styles.colTime]}>{formatTime(result.seconds)}</Text>
              <Text style={[styles.tableCell, styles.colHints]}>{result.usedHints ? t('yes') : t('no')}</Text>
              <Text style={[styles.tableCell, styles.colUndo]}>{result.undoCount}</Text>
            </View>
          ))
        )}
      </View>
      <SecondaryButton label={t('backToMenu')} leadingIconName="arrow-back" onPress={onBack} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'flex-start'
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
  statsGridRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12
  },
  halfCard: {
    width: '48.5%'
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
  },
  tableHead: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    paddingBottom: 6,
    marginBottom: 6
  },
  tableHeadCell: {
    color: '#b7b1a7',
    fontSize: 12,
    fontWeight: '700'
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)'
  },
  tableCell: {
    color: '#f7f3e8',
    fontSize: 13
  },
  colNum: {
    width: '8%'
  },
  colMoves: {
    width: '18%'
  },
  colTime: {
    width: '24%'
  },
  colHints: {
    width: '24%'
  },
  colUndo: {
    width: '18%'
  }
});
