import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SecondaryButton } from '../components/Buttons';
import { GameSettings } from '../hooks/useSettings';

export const SettingsScreen = ({
  settings,
  onChangeSettings,
  onBack
}: {
  settings: GameSettings;
  onChangeSettings: (next: GameSettings) => void;
  onBack: () => void;
}) => {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Настройки игры</Text>
      <View style={styles.settingsCard}>
        <View style={styles.toggleRow}>
          <SecondaryButton
            label="1 карта"
            onPress={() => onChangeSettings({ ...settings, drawCount: 1 })}
            style={settings.drawCount === 1 ? styles.toggleActive : undefined}
            labelStyle={settings.drawCount === 1 ? styles.toggleActiveText : undefined}
          />
          <SecondaryButton
            label="3 карты"
            onPress={() => onChangeSettings({ ...settings, drawCount: 3 })}
            style={settings.drawCount === 3 ? styles.toggleActive : undefined}
            labelStyle={settings.drawCount === 3 ? styles.toggleActiveText : undefined}
          />
        </View>
        <Text style={styles.settingsHint}>
          В режиме 3 карты брать можно только верхнюю.
        </Text>
      </View>
      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Виброотклик</Text>
        <View style={styles.toggleRow}>
          <SecondaryButton
            label="Вкл"
            onPress={() => onChangeSettings({ ...settings, hapticsEnabled: true })}
            style={settings.hapticsEnabled ? styles.toggleActive : undefined}
            labelStyle={settings.hapticsEnabled ? styles.toggleActiveText : undefined}
          />
          <SecondaryButton
            label="Выкл"
            onPress={() => onChangeSettings({ ...settings, hapticsEnabled: false })}
            style={!settings.hapticsEnabled ? styles.toggleActive : undefined}
            labelStyle={!settings.hapticsEnabled ? styles.toggleActiveText : undefined}
          />
        </View>
      </View>
      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Режим руки</Text>
        <View style={styles.toggleRow}>
          <SecondaryButton
            label="Правша"
            onPress={() => onChangeSettings({ ...settings, handOrientation: 'right' })}
            style={settings.handOrientation === 'right' ? styles.toggleActive : undefined}
            labelStyle={settings.handOrientation === 'right' ? styles.toggleActiveText : undefined}
          />
          <SecondaryButton
            label="Левша"
            onPress={() => onChangeSettings({ ...settings, handOrientation: 'left' })}
            style={settings.handOrientation === 'left' ? styles.toggleActive : undefined}
            labelStyle={settings.handOrientation === 'left' ? styles.toggleActiveText : undefined}
          />
        </View>
        <Text style={styles.settingsHint}>
          Правша перемещает колоду и сброс вправо, чтобы добраться до них правой рукой.
        </Text>
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
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20
  },
  settingsCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12
  },
  toggleActive: {
    backgroundColor: '#f4d35e'
  },
  settingsTitle: {
    color: '#f7f3e8',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10
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
