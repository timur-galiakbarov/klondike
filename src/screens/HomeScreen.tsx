import React from 'react';
import { StyleSheet, View, Image, Text, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { useAnalytics } from '../hooks/useAnalytics';

export const HomeScreen = ({
  onStart,
  onContinue,
  hasSaved,
  onSettings,
  onStats,
}: {
  onStart: () => void;
  onContinue: () => void;
  hasSaved: boolean;
  onSettings: () => void;
  onStats: () => void;
}) => {
  const { sendAnalytics } = useAnalytics();
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
        <Image source={require('../../assets/game-icon-4.png')} style={styles.logo} />
        <Text style={styles.title}>Пасьянс Косынка</Text>
        <Text style={styles.subtitle}>Классический</Text>
        <View style={styles.menu}>
          {hasSaved && <SecondaryButton label="Продолжить игру" onPress={onContinue} />}
          <PrimaryButton label="Новая игра" onPress={handleStart} />
          <SecondaryButton label="Настройки игры" onPress={onSettings} />
          <SecondaryButton label="Мои результаты" onPress={onStats} />
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
    maxHeight: 320,
    marginBottom: 8,
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
    marginBottom: 24,
  },
  menu: {
    width: '100%',
    gap: 16
  }
});
