import React, { useRef } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Rect } from '../game/types';
import { CARD_WIDTH, CARD_HEIGHT } from '../game/constants';

export const Pile = ({
  label,
  highlight,
  onLayout,
  children,
  style
}: {
  label: string;
  highlight: boolean;
  onLayout?: (rect: Rect) => void;
  children: React.ReactNode;
  style?: ViewStyle;
}) => {
  const ref = useRef<View>(null);
  return (
    <View
      ref={ref}
      style={[styles.pile, highlight && styles.pileHighlight, style]}
      onLayout={() => {
        if (!onLayout) return;
        ref.current?.measureInWindow((x, y, width, height) => {
          onLayout({ x, y, width, height });
        });
      }}
    >
      {children}
      {label ? <Text style={styles.pileLabel}>{label}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  pile: {
    width: CARD_WIDTH,
    minHeight: CARD_HEIGHT + 6,
    alignItems: 'center'
  },
  pileLabel: {
    color: '#7c8b7f',
    fontSize: 12,
    marginTop: 4
  },
  pileHighlight: {
    backgroundColor: 'rgba(244,211,94,0.2)',
    borderRadius: 12
  }
});
