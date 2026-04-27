import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
  type PermissionStatus
} from 'expo-tracking-transparency';
import { SecondaryButton } from '../components/Buttons';
import { CardBack } from '../components/CardBack';
import { useAnalytics } from '../hooks/useAnalytics';
import { GameSettings } from '../hooks/useSettings';
import { CARD_BACK_THEMES } from '../game/cardBackThemes';
import { CARD_HEIGHT, CARD_WIDTH } from '../game/constants';
import { getTrackingStatusLabel, LANGUAGE_OPTIONS, t } from '../i18n';

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
      t('trackingSelectedTitle'),
      t('trackingSelectedMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('openSettings'), onPress: () => Linking.openSettings() }
      ]
    );
  };

  const trackingStatusText = getTrackingStatusLabel(trackingStatus);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('settingsTitle')}</Text>
        <SecondaryButton
          label={t('backToMenu')}
          leadingIconName="arrow-back"
          onPress={onBack}
          style={styles.topBackButton}
        />
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>{t('language')}</Text>
          <View style={styles.languageOptions}>
            {LANGUAGE_OPTIONS.map((option) => {
              const active = settings.locale === option.value;
              return (
                <SecondaryButton
                  key={option.value}
                  label={option.value === 'system' ? t('system') : option.label}
                  onPress={() => {
                    if (settings.locale === option.value) {
                      return;
                    }
                    sendAnalytics('set_language', { language: option.value });
                    onChangeSettings({ ...settings, locale: option.value });
                  }}
                  style={active ? { ...styles.languageButton, ...styles.toggleActive } : styles.languageButton}
                  labelStyle={active ? styles.toggleActiveText : undefined}
                />
              );
            })}
          </View>
          <Text style={styles.settingsHint}>{t('languageHint')}</Text>
        </View>
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>{t('drawMode')}</Text>
          <View style={styles.toggleRow}>
            <SecondaryButton
              label={t('oneCard')}
              onPress={() => {
                sendAnalytics('set1CardType');
                onChangeSettings({ ...settings, drawCount: 1 });
              }}
              style={settings.drawCount === 1 ? styles.toggleActive : undefined}
              labelStyle={settings.drawCount === 1 ? styles.toggleActiveText : undefined}
            />
            <SecondaryButton
              label={t('threeCards')}
              onPress={() => {
                sendAnalytics('set3CardType');
                onChangeSettings({ ...settings, drawCount: 3 });
              }}
              style={settings.drawCount === 3 ? styles.toggleActive : undefined}
              labelStyle={settings.drawCount === 3 ? styles.toggleActiveText : undefined}
            />
          </View>
          <Text style={styles.settingsHint}>{t('drawModeHint')}</Text>
        </View>
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>{t('haptics')}</Text>
          <View style={styles.toggleRow}>
            <SecondaryButton
              label={t('on')}
              onPress={() => onChangeSettings({ ...settings, hapticsEnabled: true })}
              style={settings.hapticsEnabled ? styles.toggleActive : undefined}
              labelStyle={settings.hapticsEnabled ? styles.toggleActiveText : undefined}
            />
            <SecondaryButton
              label={t('off')}
              onPress={() => onChangeSettings({ ...settings, hapticsEnabled: false })}
              style={!settings.hapticsEnabled ? styles.toggleActive : undefined}
              labelStyle={!settings.hapticsEnabled ? styles.toggleActiveText : undefined}
            />
          </View>
        </View>
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>{t('handMode')}</Text>
          <View style={styles.toggleRow}>
            <SecondaryButton
              label={t('rightHanded')}
              onPress={() => onChangeSettings({ ...settings, handOrientation: 'right' })}
              style={settings.handOrientation === 'right' ? styles.toggleActive : undefined}
              labelStyle={settings.handOrientation === 'right' ? styles.toggleActiveText : undefined}
            />
            <SecondaryButton
              label={t('leftHanded')}
              onPress={() => onChangeSettings({ ...settings, handOrientation: 'left' })}
              style={settings.handOrientation === 'left' ? styles.toggleActive : undefined}
              labelStyle={settings.handOrientation === 'left' ? styles.toggleActiveText : undefined}
            />
          </View>
          <Text style={styles.settingsHint}>{t('handModeHint')}</Text>
        </View>
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>{t('cardBack')}</Text>
          <View style={styles.backOptionsRow}>
            {CARD_BACK_THEMES.map((theme) => {
              const active = settings.cardBackTheme === theme.id;
              return (
                <TouchableOpacity
                  key={theme.id}
                  style={[styles.backOption, active && styles.backOptionActive]}
                  activeOpacity={0.85}
                  onPress={() => {
                    sendAnalytics('setCardBack', { theme: theme.id });
                    onChangeSettings({ ...settings, cardBackTheme: theme.id });
                  }}
                >
                  <View style={styles.backPreview}>
                    <View style={styles.backPreviewScale}>
                      <CardBack theme={theme.id} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        {Platform.OS === 'ios' && (
          <View style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>{t('privacyAds')}</Text>
            <SecondaryButton
              label={t('trackingPermission')}
              onPress={handleRequestTrackingPermission}
            />
            <Text style={styles.settingsHint}>{t('currentStatus', { status: trackingStatusText })}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center'
  },
  scroll: {
    width: '100%'
  },
  scrollContent: {
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  title: {
    color: '#f7f3e8',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20
  },
  topBackButton: {
    alignSelf: 'flex-start',
    marginBottom: 16
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
  languageOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  languageButton: {
    paddingHorizontal: 14
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
  },
  backOption: {
    width: '19%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4
  },
  backOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8
  },
  backPreview: {
    width: '100%',
    aspectRatio: CARD_WIDTH / CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  backPreviewScale: {
    transform: [{ scale: 1 }]
  },
  backOptionActive: {
    backgroundColor: '#f4d35e',
    borderColor: '#f4d35e'
  }
});
