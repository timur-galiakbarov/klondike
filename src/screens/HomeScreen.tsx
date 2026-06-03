import React from 'react';
import { StyleSheet, View, Image, Text, ImageBackground, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { useAnalytics } from '../hooks/useAnalytics';
import { t } from '../i18n';

export const HomeScreen = ({
  onStart,
  onContinue,
  hasSaved,
  dailyWinStreak,
  onSettings,
  onStats,
}: {
  onStart: () => void;
  onContinue: () => void;
  hasSaved: boolean;
  dailyWinStreak: number;
  onSettings: () => void;
  onStats: () => void;
}) => {
  const { sendAnalytics } = useAnalytics();
  const { height } = useWindowDimensions();
  const logoMaxHeight = Math.min(260, Math.max(150, height * 0.26));
  const handleStart = () => {
    sendAnalytics('gameStartedFromHomeScreen');
    onStart();
  };
  const insets = useSafeAreaInsets();
  return (
    <ImageBackground
      source={require('../../assets/bg3.png')}
      style={[styles.background, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      imageStyle={[
        styles.backgroundImage,
        { top: -insets.top, bottom: -insets.bottom }
      ]}
    >
      <View style={styles.screen}>
        <Image
          source={require('../../assets/game-icon-4.png')}
          style={[styles.logo, { maxHeight: logoMaxHeight }]}
        />
        <View style={styles.streakCard}>
          <Text style={styles.streakTitle} numberOfLines={1} adjustsFontSizeToFit>
            {t('dailyWinStreakTitle')}
          </Text>
          <View style={styles.streakBody}>
            <View style={styles.streakBadge}>
              <Ionicons name="trophy" size={25} color="#f4d35e" />
              <View style={styles.winRibbon}>
                <Text style={styles.winRibbonText}>{t('win')}</Text>
              </View>
            </View>
            <Text style={styles.streakCount}>{t('dailyWinStreakCount', { count: dailyWinStreak })}</Text>
          </View>
        </View>
        <Text style={styles.title}>{t('homeTitle')}</Text>
        <Text style={styles.subtitle}>{t('homeSubtitle')}</Text>
        <View style={styles.menu}>
          {hasSaved && <SecondaryButton label={t('continueGame')} onPress={onContinue} />}
          <PrimaryButton label={t('newGame')} onPress={handleStart} />
          <SecondaryButton label={t('gameSettings')} onPress={onSettings} />
          <SecondaryButton label={t('myResults')} onPress={onStats} />
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1
  },
  backgroundImage: {
    resizeMode: 'cover'
  },
  screen: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  logo: {
    width: '100%',
    marginBottom: 10,
    resizeMode: 'contain'
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#e0e0e0',
    textAlign: 'center',
    marginBottom: 22,
  },
  streakCard: {
    width: '82%',
    maxWidth: 280,
    borderRadius: 12,
    backgroundColor: 'rgba(247,243,232,0.96)',
    borderWidth: 1,
    borderColor: '#d6cdb8',
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3
  },
  streakTitle: {
    backgroundColor: '#e5ddcb',
    color: '#2d5b43',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 17,
    paddingVertical: 5,
    paddingHorizontal: 12,
    textAlign: 'center'
  },
  streakBody: {
    minHeight: 52,
    paddingVertical: 7,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 26
  },
  streakBadge: {
    width: 54,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#4067d8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1f1b14',
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  winRibbon: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: -5,
    borderRadius: 6,
    backgroundColor: '#1f6f4a',
    paddingVertical: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)'
  },
  winRibbonText: {
    color: '#ffffff',
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    includeFontPadding: false
  },
  streakCount: {
    color: '#1f1b14',
    fontSize: 23,
    fontWeight: '900',
    lineHeight: 28
  },
  menu: {
    width: '100%',
    gap: 16
  }
});
