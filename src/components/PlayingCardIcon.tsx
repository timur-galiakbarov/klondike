import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';

const CARD_FILL = '#f7f3e8';
const CARD_STROKE = '#1e1a14';
const HEART_FILL = '#c2352f';
const CARD_CORNER = 9;
const HEART_PATH = 'M0 -6 C-3 -6 -5 -3 -5 -1 C-5 3 -2 6 0 8 C2 6 5 3 5 -1 C5 -3 3 -6 0 -6 Z';

const HeartPip = ({ x, y, scale = 1, rotate = 0 }: { x: number; y: number; scale?: number; rotate?: number }) => (
  <Path
    d={HEART_PATH}
    fill={HEART_FILL}
    transform={`translate(${x}, ${y}) rotate(${rotate}) scale(${scale})`}
  />
);

type IconProps = {
  style?: StyleProp<ViewStyle>;
};

export const SevenHeartsCard = ({ style }: IconProps) => (
  <Svg width={44} height={52} viewBox="0 0 44 52" style={style}>
    <Rect x={2} y={2} width={40} height={48} rx={CARD_CORNER} fill={CARD_FILL} stroke={CARD_STROKE} strokeWidth={1.3} />
    <Path
      d="M18 18v-6h-4v20h4v-6h4v-8h-4z"
      stroke={CARD_STROKE}
      strokeWidth={1}
      fill="none"
    />

    <HeartPip x={22} y={22} />
    <HeartPip x={16} y={30} scale={0.9} />
    <HeartPip x={26} y={30} scale={0.9} />
    <HeartPip x={20} y={36} scale={0.9} />
    <HeartPip x={24} y={40} scale={0.9} />
    <HeartPip x={18} y={44} scale={0.8} />
    <HeartPip x={26} y={44} scale={0.8} />
  </Svg>
);
