import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const SCREEN = { width: SCREEN_WIDTH, height: SCREEN_HEIGHT };

export const CARD_RATIO = 1.4; // height = width * ratio
export const GAP = 6;
export const PADDING = 10;
export const CARD_WIDTH = Math.min(78, (SCREEN_WIDTH - PADDING * 2 - GAP * 6) / 7);
export const CARD_HEIGHT = CARD_WIDTH * CARD_RATIO;
export const TABLEAU_STACK_STEP = 24;
