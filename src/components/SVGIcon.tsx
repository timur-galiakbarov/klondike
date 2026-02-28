import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

const CARD_FILL = '#f7f3e8';
const CARD_STROKE = '#1e1a14';

type IconProps = {
  style?: StyleProp<ViewStyle>;
};

export const SingleCardIcon = ({ style }: IconProps) => (
  <Svg width={44} height={52} viewBox="0 0 44 52" style={style}>
    <Rect
      x={8}
      y={7}
      width={28}
      height={38}
      rx={9}
      fill={CARD_FILL}
      stroke={CARD_STROKE}
      strokeWidth={1.5}
    />
    <Rect
      x={11}
      y={10}
      width={22}
      height={34}
      rx={7}
      fill="none"
      stroke={CARD_STROKE}
      strokeWidth={0.9}
    />
  </Svg>
);

export const TripleCardsIcon = ({ style }: IconProps) => (
  <Svg width={52} height={58} viewBox="0 0 52 58" style={style}>
    <Rect
      x={6}
      y={20}
      width={32}
      height={38}
      rx={8}
      fill={CARD_FILL}
      stroke={CARD_STROKE}
      strokeWidth={1.3}
      opacity={0.4}
    />
    <Rect
      x={10}
      y={12}
      width={32}
      height={38}
      rx={8}
      fill={CARD_FILL}
      stroke={CARD_STROKE}
      strokeWidth={1.3}
      opacity={0.7}
    />
    <Rect
      x={14}
      y={4}
      width={32}
      height={38}
      rx={8}
      fill={CARD_FILL}
      stroke={CARD_STROKE}
      strokeWidth={1.3}
    />
  </Svg>
);
