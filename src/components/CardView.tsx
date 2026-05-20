import React, { useRef } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Card } from '../game/types';
import { isRed, rankLabel, suitSymbol } from '../game/utils';
import { CARD_HEIGHT, CARD_WIDTH } from '../game/constants';
import { Rect } from '../game/types';

const BASE_CARD_WIDTH = 72;
const SCALE = CARD_WIDTH / BASE_CARD_WIDTH;
const CORNER_SUIT_FONT_SIZE = Math.max(12, Math.min(18, Math.round(15 * SCALE)));
const MAIN_SUIT_FONT_SIZE = Math.max(28, Math.min(38, Math.round(33 * SCALE)));

export const CardView = ({
  card,
  onLayout,
  onStart,
  onTap,
  floating,
  disabled,
  hidden,
  ghost,
  style
}: {
  card: Card;
  onLayout?: (rect: Rect) => void;
  onStart?: (pageX: number, pageY: number, rect: Rect) => void;
  onTap?: () => void;
  floating?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  ghost?: boolean;
  style?: ViewStyle;
}) => {
  const ref = useRef<View>(null);
  return (
    <View
      ref={ref}
      style={[
        styles.card,
        floating && styles.cardFloating,
        hidden && styles.cardHidden,
        ghost && styles.cardGhost,
        style
      ]}
      onLayout={() => {
        if (!onLayout) return;
        ref.current?.measureInWindow((x, y, width, height) => {
          onLayout({ x, y, width, height });
        });
      }}
      onStartShouldSetResponder={() => !disabled && !hidden}
      onResponderGrant={(event) => {
        if (!onStart) return;
        ref.current?.measureInWindow((x, y, width, height) => {
          onStart(event.nativeEvent.pageX, event.nativeEvent.pageY, {
            x,
            y,
            width,
            height
          });
        });
      }}
      onResponderRelease={() => {
        if (disabled || hidden) return;
        if (onTap) onTap();
      }}
    >
      <Text style={[styles.cardCornerSuit, isRed(card.suit) && styles.cardRankRed]}>
        {suitSymbol(card.suit)}
      </Text>
      <Text style={[styles.cardRank, isRed(card.suit) && styles.cardRankRed]}>
        {rankLabel(card.rank)}
      </Text>
      <Text style={[styles.cardSuit, isRed(card.suit) && styles.cardRankRed]}>
        {suitSymbol(card.suit)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 9,
    backgroundColor: '#f7f3e8',
    borderWidth: 1,
    borderColor: '#d6cdb8',
    padding: 6,
    justifyContent: 'space-between'
  },
  cardFloating: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6
  },
  cardHidden: {
    opacity: 0
  },
  cardGhost: {
    opacity: 0.35
  },
  cardHighlighted: {
    backgroundColor: '#fff3cf',
    borderColor: '#f4d35e',
    shadowColor: '#f4d35e',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6
  },
  cardRank: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1b14',
    marginTop: -4
  },
  cardCornerSuit: {
    position: 'absolute',
    top: 6,
    right: 4,
    fontSize: CORNER_SUIT_FONT_SIZE,
    fontWeight: '700',
    color: '#1f1b14'
  },
  cardSuit: {
    fontSize: MAIN_SUIT_FONT_SIZE,
    fontWeight: '700',
    textAlign: 'right',
    color: '#1f1b14',
    marginBottom: 2
  },
  cardRankRed: {
    color: '#c2352f'
  }
});
