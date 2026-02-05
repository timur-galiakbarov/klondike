import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { GameSettings } from '../hooks/useSettings';

export const HomeScreen = ({
  onStart,
  onContinue,
  hasSaved,
  onStats,
  settings,
  onChangeSettings
}: {
  onStart: () => void;
  onContinue: () => void;
  hasSaved: boolean;
  onStats: () => void;
  settings: GameSettings;
  onChangeSettings: (next: GameSettings) => void;
}) => {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Пасьянс косынка</Text>
      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Настройки игры</Text>
        <View style={styles.toggleRow}>
          <SecondaryButton
            label="1 карта"
            onPress={() => onChangeSettings({ drawCount: 1 })}
            style={settings.drawCount === 1 ? styles.toggleActive : undefined}
            labelStyle={settings.drawCount === 1 ? styles.toggleActiveText : undefined}
          />
          <SecondaryButton
            label="3 карты"
            onPress={() => onChangeSettings({ drawCount: 3 })}
            style={settings.drawCount === 3 ? styles.toggleActive : undefined}
            labelStyle={settings.drawCount === 3 ? styles.toggleActiveText : undefined}
          />
        </View>
        <Text style={styles.settingsHint}>
          В режиме 3 карты брать можно только верхнюю.
        </Text>
      </View>
      <View style={styles.menu}>
        {hasSaved && <SecondaryButton label="Продолжить игру" onPress={onContinue} />}
        <PrimaryButton label="Новая игра" onPress={onStart} />
        <SecondaryButton label="Мои результаты" onPress={onStats} />
      </View>
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
  menu: {
    width: '100%',
    gap: 16
  },
  settingsCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20
  },
  settingsTitle: {
    color: '#f7f3e8',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12
  },
  toggleActive: {
    backgroundColor: '#f4d35e'
  },
  settingsHint: {
    color: '#b7b1a7',
    fontSize: 12,
    marginTop: 10
  },
  toggleActiveText: {
    color: '#1e1a14'
  }
});
