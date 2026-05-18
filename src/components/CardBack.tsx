import React from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { CARD_HEIGHT, CARD_WIDTH } from '../game/constants';
import { CardBackTheme } from '../game/cardBackThemes';

const THEME_SOURCE: Record<Exclude<CardBackTheme, 'classic'>, ImageSourcePropType> = {
  pexels_bengi: require('../../assets/suit/pexels-bengiphotos-34352599.jpg'),
  pexels_nui: require('../../assets/suit/pexels-nui-malama-169330637-35756370.jpg'),
  pexels_anniroenkae_4175070: require('../../assets/suit/pexels-anniroenkae-4175070.jpg'),
  pexels_eberhardgross_2088205: require('../../assets/suit/pexels-eberhardgross-2088205.jpg'),
  pexels_anniroenkae_2832432: require('../../assets/suit/pexels-anniroenkae-2832432.jpg'),
  pexels_enginakyurt_1820511: require('../../assets/suit/pexels-enginakyurt-1820511.jpg'),
  pexels_sebastian_palomino_1955134: require('../../assets/suit/pexels-sebastian-palomino-933481-1955134.jpg'),
  pexels_anete_lusina_6331082: require('../../assets/suit/pexels-anete-lusina-6331082.jpg'),
  pexels_eberhardgross_1366919: require('../../assets/suit/pexels-eberhardgross-1366919.jpg')
};

const DARK_BORDER_THEMES: CardBackTheme[] = [
  'pexels_nui',
  'pexels_sebastian_palomino_1955134',
  'pexels_anniroenkae_4175070',
  'pexels_eberhardgross_1366919'
];

const EXTRA_DARK_BORDER_THEMES: CardBackTheme[] = ['pexels_anete_lusina_6331082'];

const ClassicBack = () => (
  <View style={[styles.card, styles.classicCard]}>
    <View style={styles.classicInner}>
      <View style={styles.classicStripe} />
      <View style={styles.classicStripe} />
      <View style={styles.classicStripe} />
    </View>
  </View>
);

export const CardBack = ({
  disabled,
  theme = 'classic'
}: {
  disabled?: boolean;
  theme?: CardBackTheme;
}) => (
  theme === 'classic' ? (
    <ClassicBack />
  ) : (
    <View
      style={[
        styles.card,
        DARK_BORDER_THEMES.includes(theme) && styles.darkBorderCard,
        EXTRA_DARK_BORDER_THEMES.includes(theme) && styles.extraDarkBorderCard
      ]}
    >
      <Image source={THEME_SOURCE[theme]} style={styles.image} resizeMode="cover" />
    </View>
  )
);

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#c4b9a5',
    overflow: 'hidden'
  },
  classicCard: {
    backgroundColor: '#2c4a7d',
    borderColor: '#e3e0d4',
    justifyContent: 'center',
    alignItems: 'center'
  },
  classicInner: {
    width: '86%',
    height: '86%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'space-evenly',
    paddingVertical: 6
  },
  classicStripe: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: 8,
    borderRadius: 3
  },
  image: {
    width: '100%',
    height: '100%'
  },
  darkBorderCard: {
    borderColor: '#5d5142'
  },
  extraDarkBorderCard: {
    borderColor: '#3d3329'
  }
});
