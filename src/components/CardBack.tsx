import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CARD_HEIGHT, CARD_WIDTH } from '../game/constants';

export const CardBack = ({ disabled }: { disabled?: boolean }) => (
  <View style={[styles.card, styles.cardBack, disabled && styles.cardBackDim]}>
    <View style={styles.cardBackInner}>
      <View style={styles.cardBackStripe} />
      <View style={styles.cardBackStripe} />
      <View style={styles.cardBackStripe} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d6cdb8'
  },
  cardBack: {
    backgroundColor: '#2c4a7d',
    borderColor: '#e3e0d4',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardBackInner: {
    width: '86%',
    height: '86%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'space-evenly',
    paddingVertical: 6
  },
  cardBackStripe: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: 8,
    borderRadius: 3
  },
  cardBackDim: {
    opacity: 0.7
  }
});
