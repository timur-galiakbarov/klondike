export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export type Card = {
  id: string;
  suit: Suit;
  rank: number; // 1..13
  faceUp: boolean;
};

export type DragSource =
  | { type: 'tableau'; index: number; cardIndex: number }
  | { type: 'foundation'; index: number }
  | { type: 'waste' };

export type DragState = {
  source: DragSource;
  cards: Card[];
  offset: { x: number; y: number };
};

export type FoundationPile = {
  suit?: Suit;
  cards: Card[];
};

export type GameState = {
  stock: Card[];
  waste: Card[];
  wasteVisibleCount: number;
  tableau: Card[][];
  foundations: FoundationPile[];
};

export type Rect = { x: number; y: number; width: number; height: number };

export type BestResult = {
  moves: number;
  seconds: number;
  usedHints: boolean;
  undoCount: number;
};

export type Stats = {
  totalGames: number;
  completedGames: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  lastPlayedAt: string | null;
  dailyWinStreak: number;
  lastWinDate: string | null;
  bestTimes: number[];
  bestMoves: number[];
  bestResults: BestResult[];
};

export type DealDifficulty = 'very-easy' | 'easy' | 'medium' | 'hard';

export type DealReason =
  | 'onboarding'
  | 'loss-protection'
  | 'returning-player'
  | 'win-streak'
  | 'regular';

export type DealPlan = {
  seed: number;
  difficulty: DealDifficulty;
  reason: DealReason;
  guaranteedSolvable: boolean;
};
