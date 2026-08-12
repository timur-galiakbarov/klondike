import { Card, DealDifficulty, DealPlan, GameState, Stats, Suit } from './types';
import { RANKS, SUITS } from './utils';

type RandomSource = () => number;

const DAY_MS = 86_400_000;

const createSeed = (random: RandomSource) =>
  Math.max(1, Math.floor(random() * 0x7fffffff));

export const createSeededRandom = (seed: number): RandomSource => {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
};

const weightedPick = <T>(
  entries: ReadonlyArray<{ value: T; weight: number }>,
  random: RandomSource
): T => {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = random() * total;
  for (const entry of entries) {
    cursor -= entry.weight;
    if (cursor < 0) return entry.value;
  }
  return entries[entries.length - 1].value;
};

const guaranteedChance: Record<DealDifficulty, number> = {
  'very-easy': 1,
  easy: 1,
  medium: 0.85,
  hard: 0.8
};

export const selectDealPlan = (
  stats: Pick<
    Stats,
    'totalGames' | 'consecutiveWins' | 'consecutiveLosses' | 'lastPlayedAt'
  >,
  now = Date.now(),
  random: RandomSource = Math.random
): DealPlan => {
  let difficulty: DealDifficulty;
  let reason: DealPlan['reason'];

  if (stats.totalGames < 3) {
    difficulty = stats.totalGames === 0 ? 'easy' : 'medium';
    reason = 'onboarding';
  } else if (stats.consecutiveLosses >= 3) {
    difficulty = weightedPick(
      [
        { value: 'very-easy' as const, weight: 0.6 },
        { value: 'easy' as const, weight: 0.4 }
      ],
      random
    );
    reason = 'loss-protection';
  } else if (stats.consecutiveLosses >= 2) {
    difficulty = weightedPick(
      [
        { value: 'easy' as const, weight: 0.75 },
        { value: 'medium' as const, weight: 0.25 }
      ],
      random
    );
    reason = 'loss-protection';
  } else {
    const lastPlayedAt = stats.lastPlayedAt ? new Date(stats.lastPlayedAt).getTime() : Number.NaN;
    const awayDays = Number.isFinite(lastPlayedAt) ? (now - lastPlayedAt) / DAY_MS : 0;

    if (awayDays >= 7) {
      difficulty = 'easy';
      reason = 'returning-player';
    } else if (awayDays >= 1) {
      difficulty = weightedPick(
        [
          { value: 'easy' as const, weight: 0.65 },
          { value: 'medium' as const, weight: 0.35 }
        ],
        random
      );
      reason = 'returning-player';
    } else if (stats.consecutiveWins >= 4) {
      difficulty = weightedPick(
        [
          { value: 'hard' as const, weight: 0.6 },
          { value: 'medium' as const, weight: 0.3 },
          { value: 'easy' as const, weight: 0.1 }
        ],
        random
      );
      reason = 'win-streak';
    } else if (stats.consecutiveWins >= 2) {
      difficulty = weightedPick(
        [
          { value: 'medium' as const, weight: 0.65 },
          { value: 'hard' as const, weight: 0.25 },
          { value: 'easy' as const, weight: 0.1 }
        ],
        random
      );
      reason = 'win-streak';
    } else {
      difficulty = weightedPick(
        [
          { value: 'easy' as const, weight: 0.2 },
          { value: 'medium' as const, weight: 0.6 },
          { value: 'hard' as const, weight: 0.2 }
        ],
        random
      );
      reason = 'regular';
    }
  }

  const mustBeSolvable =
    reason === 'onboarding' ||
    reason === 'loss-protection' ||
    reason === 'returning-player';

  return {
    seed: createSeed(random),
    difficulty,
    reason,
    guaranteedSolvable: mustBeSolvable || random() < guaranteedChance[difficulty]
  };
};

const shuffle = <T>(items: T[], random: RandomSource) => {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [items[index], items[target]] = [items[target], items[index]];
  }
  return items;
};

const createCard = (suit: Suit, rank: number, seed: number, faceUp = false): Card => ({
  id: `${suit}-${rank}-${seed}`,
  suit,
  rank,
  faceUp
});

const createRandomDeal = (seed: number): GameState => {
  const random = createSeededRandom(seed);
  const deck = shuffle(
    SUITS.flatMap((suit) => RANKS.map((rank) => createCard(suit, rank, seed))),
    random
  );
  const tableau = Array.from({ length: 7 }, (_, index) => {
    const pile = deck.splice(0, index + 1);
    pile[pile.length - 1].faceUp = true;
    return pile;
  });
  return {
    stock: deck,
    waste: [],
    wasteVisibleCount: 0,
    tableau,
    foundations: Array.from({ length: 4 }, () => ({ cards: [] }))
  };
};

// These are ordinary shuffled deals verified by the solver in solver.ts.
// Difficulty is based on the verified solution's tableau moves and stock passes.
export const SOLVABLE_DEAL_SEEDS: Record<1 | 3, Record<DealDifficulty, readonly number[]>> = {
  1: {
    'very-easy': [12, 179, 247, 275, 314, 423, 540],
    easy: [249, 269, 280, 281, 342, 361, 401, 411, 467, 477, 486, 511],
    medium: [5, 16, 32, 42, 66, 103, 110, 164, 202, 213, 251, 253, 278, 283, 345, 400, 417, 445, 472, 482, 536],
    hard: [25, 87, 90, 100, 108, 114, 136, 142, 146, 154, 175, 209, 212, 218, 220, 260, 264, 282, 320, 328, 332, 338, 348, 358, 365, 393, 407, 414, 429, 430, 441, 450, 457, 458, 473, 474, 484, 524, 544]
  },
  3: {
    'very-easy': [100, 135, 137, 179, 224, 329, 342],
    easy: [12, 30, 42, 44, 63, 72, 145, 195, 235, 249, 257, 261, 283, 311, 322, 345, 350],
    medium: [2, 13, 32, 49, 56, 108, 123, 155, 162, 165, 188, 192, 218, 231, 247, 264, 272, 285, 287, 300, 310, 338, 341, 354, 360],
    hard: [9, 10, 22, 39, 52, 59, 74, 96, 111, 112, 115, 130, 140, 146, 150, 159, 160, 166, 177, 197, 202, 213, 226, 239, 244, 254, 295, 323, 331, 335, 348]
  }
};

const selectVerifiedSeed = (plan: DealPlan, drawCount: 1 | 3) => {
  const candidates = SOLVABLE_DEAL_SEEDS[drawCount][plan.difficulty];
  return candidates[plan.seed % candidates.length];
};

export const dealFromPlan = (plan: DealPlan, drawCount: 1 | 3): GameState =>
  plan.guaranteedSolvable
    ? createRandomDeal(selectVerifiedSeed(plan, drawCount))
    : createRandomDeal(plan.seed);
