import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View
} from 'react-native';
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
  type PermissionStatus
} from 'expo-tracking-transparency';
import { SecondaryButton } from '../components/Buttons';
import { useAnalytics } from '../hooks/useAnalytics';
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
  const { sendAnalytics } = useAnalytics();
  const [trackingStatus, setTrackingStatus] = useState<PermissionStatus | 'unavailable'>('unavailable');

  const refreshTrackingStatus = async () => {
    if (Platform.OS !== 'ios') {
      setTrackingStatus('unavailable');
      return;
    }

    const { status } = await getTrackingPermissionsAsync();
    setTrackingStatus(status);
  };

  useEffect(() => {
    refreshTrackingStatus();
  }, []);

  const handleRequestTrackingPermission = async () => {
    if (Platform.OS !== 'ios') {
      return;
    }

    const { status } = await getTrackingPermissionsAsync();
    if (status === 'undetermined') {
      sendAnalytics('request_tracking_permission');
      const response = await requestTrackingPermissionsAsync();
      setTrackingStatus(response.status);
      return;
    }

    setTrackingStatus(status);
    Alert.alert(
      'Разрешение уже выбрано',
      'iOS показывает окно ATT только один раз. Изменить выбор можно в системных настройках.',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Открыть настройки', onPress: () => Linking.openSettings() }
      ]
    );
  };

  const trackingStatusText = trackingStatus === 'unavailable'
    ? 'Недоступно на этом устройстве'
    : trackingStatus;

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Настройки игры</Text>
      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Раскладка карт</Text>
        <View style={styles.toggleRow}>
          <SecondaryButton
            label="1 карта"
            onPress={() => {
              sendAnalytics('set1CardType');
              onChangeSettings({ ...settings, drawCount: 1 });
            }}
            style={settings.drawCount === 1 ? styles.toggleActive : undefined}
            labelStyle={settings.drawCount === 1 ? styles.toggleActiveText : undefined}
          />
          <SecondaryButton
            label="3 карты"
            onPress={() => {
              sendAnalytics('set3CardType');
              onChangeSettings({ ...settings, drawCount: 3 });
            }}
            style={settings.drawCount === 3 ? styles.toggleActive : undefined}
            labelStyle={settings.drawCount === 3 ? styles.toggleActiveText : undefined}
          />
        </View>
        <Text style={styles.settingsHint}>
          В режиме раскладки по 3 карты можно брать только верхнюю. Изменения применятся для новой игры.
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
      {Platform.OS === 'ios' && (
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Конфиденциальность и реклама</Text>
          <SecondaryButton
            label="Разрешение на отслеживание (ATT)"
            onPress={handleRequestTrackingPermission}
          />
          <Text style={styles.settingsHint}>Текущий статус: {trackingStatusText}</Text>
        </View>
      )}
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
