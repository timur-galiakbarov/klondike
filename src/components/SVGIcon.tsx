import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
<<<<<<< ours
import Svg, { Rect, Path, Text as SvgText, Circle } from 'react-native-svg';

const CARD_FILL = '#f7f3e8';
const CARD_STROKE = '#1e1a14';
const HEART_FILL = '#d62828';
const SPADE_FILL = '#1b1b1f';
const CLUB_FILL = '#006994';
const CARD_CORNER = 9;
const HEART_PATH = 'M0 -5 C-3 -5 -4 -3 -4 -1 C-4 2 -2 4 0 6 C2 4 4 2 4 -1 C4 -3 3 -5 0 -5 Z';
const HEART_POSITIONS = [
  { x: 18, y: 18 },
  { x: 30, y: 18 },
  { x: 12, y: 30 },
  { x: 18, y: 30 },
  { x: 24, y: 30 },
  { x: 16, y: 44 },
  { x: 28, y: 44 }
];
=======
import Svg, { Rect } from 'react-native-svg';

const CARD_FILL = '#f7f3e8';
const CARD_STROKE = '#1e1a14';
>>>>>>> theirs

type IconProps = {
  style?: StyleProp<ViewStyle>;
};

const HeartPip = ({ x, y, scale = 1, rotate = 0 }: { x: number; y: number; scale?: number; rotate?: number }) => (
  <Path d={HEART_PATH} fill={HEART_FILL} transform={`translate(${x}, ${y}) rotate(${rotate}) scale(${scale})`} />
);

const CornerHeart = ({ x, y, rotate = 0 }: { x: number; y: number; rotate?: number }) => (
  <Path d={HEART_PATH} fill={HEART_FILL} transform={`translate(${x}, ${y}) rotate(${rotate}) scale(0.7)`} />
);

export const SingleCardIcon = ({ style }: IconProps) => (
  <Svg width={44} height={52} viewBox="0 0 44 52" style={style}>
<<<<<<< ours
    <Rect x={2} y={2} width={40} height={48} rx={CARD_CORNER} fill={CARD_FILL} stroke={CARD_STROKE} strokeWidth={1.5} />
    <Rect x={6} y={6} width={32} height={40} rx={7} fill="none" stroke={CARD_STROKE} strokeWidth={0.9} />

    <SvgText x={10} y={16} fontSize={10} fontWeight="700" fill={CARD_STROKE}>
      7
    </SvgText>
    <CornerHeart x={12} y={24} />

    <SvgText x={34} y={38} fontSize={10} fontWeight="700" fill={CARD_STROKE} transform="rotate(180 34 38)">
      7
    </SvgText>
    <CornerHeart x={32} y={32} rotate={180} />

    {HEART_POSITIONS.map((pos, index) => (
      <HeartPip key={`heart-${index}`} x={pos.x} y={pos.y} scale={0.9} />
    ))}
=======
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
>>>>>>> theirs
  </Svg>
);

export const TripleCardsIcon = ({ style }: IconProps) => (
<<<<<<< ours
  <Svg width={110} height={64} viewBox="0 0 110 64" style={style}>
    <Rect x={0} y={6} width={36} height={52} rx={CARD_CORNER} fill={CARD_FILL} stroke={CARD_STROKE} strokeWidth={1.3} />
    <Rect x={38} y={6} width={36} height={52} rx={CARD_CORNER} fill={CARD_FILL} stroke={CARD_STROKE} strokeWidth={1.3} />
    <Rect x={76} y={6} width={36} height={52} rx={CARD_CORNER} fill={CARD_FILL} stroke={CARD_STROKE} strokeWidth={1.3} />

    <Circle cx={18} cy={32} r={5} fill={HEART_FILL} />
    <Path d="M18 26c-3 0-5 3-5 6s2 6 5 6 5-3 5-6-2-6-5-6z" fill={HEART_FILL} />

    <Circle cx={56} cy={32} r={6} fill={SPADE_FILL} />
    <Path d="M56 32v10" stroke="white" strokeWidth={1.6} strokeLinecap="round" />

    <Circle cx={94} cy={32} r={6} fill={CLUB_FILL} opacity={0.9} />
    <Path d="M94 26l0 16" stroke="white" strokeWidth={1.6} strokeLinecap="round" />
    <Path d="M88 32h12" stroke="white" strokeWidth={1.6} strokeLinecap="round" />
=======
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
>>>>>>> theirs
  </Svg>
);
