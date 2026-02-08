import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';

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
  return (
    <View style={styles.screen}>
      <Image source={require('../../assets/game-icon3.png')} style={styles.logo} />
      <View style={styles.menu}>
        {hasSaved && <SecondaryButton label="Продолжить игру" onPress={onContinue} />}
        <PrimaryButton label="Новая игра" onPress={onStart} />
        <SecondaryButton label="Настройки игры" onPress={onSettings} />
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
    justifyContent: 'center',
    backgroundColor: '#0f2a1f'
  },
  logo: {
    width: '100%',
    maxHeight: 300,
    marginBottom: 40,
    resizeMode: 'contain'
  },
  menu: {
    width: '100%',
    gap: 16
  }
});
