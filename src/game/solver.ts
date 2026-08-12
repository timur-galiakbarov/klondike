import { Card, GameState } from './types';
import { canPlaceOnTableau, cloneState, isRed } from './utils';

type SolverState = {
  stock: Card[];
  waste: Card[];
  tableau: Card[][];
  foundations: number[];
};

export type SolveResult = {
  solved: boolean;
  exploredStates: number;
  moves: number;
  tableauMoves: number;
  stockPasses: number;
  forcedMoves: number;
};

type MoveStats = Omit<SolveResult, 'solved' | 'exploredStates'>;

const suitIndex = (card: Card) => {
  switch (card.suit) {
    case 'hearts': return 0;
    case 'diamonds': return 1;
    case 'clubs': return 2;
    case 'spades': return 3;
  }
};

const cardCode = (card: Card) => suitIndex(card) * 13 + card.rank;

const cloneSolverState = (state: SolverState): SolverState => ({
  stock: state.stock.map((card) => ({ ...card })),
  waste: state.waste.map((card) => ({ ...card })),
  tableau: state.tableau.map((pile) => pile.map((card) => ({ ...card }))),
  foundations: [...state.foundations]
});

const stateKey = (state: SolverState) => {
  const tableau = state.tableau
    .map((pile) => pile.map((card) => `${card.faceUp ? '' : 'x'}${cardCode(card)}`).join('.'))
    .sort()
    .join('/');
  return `${state.foundations.join('.')};${tableau};${state.stock.map(cardCode).join('.')};${state.waste.map(cardCode).join('.')}`;
};

const canMoveToFoundation = (card: Card, foundations: number[]) =>
  card.rank === foundations[suitIndex(card)] + 1;

const isSafeFoundationMove = (card: Card, foundations: number[]) => {
  if (card.rank <= 2) return true;
  const opposite = isRed(card.suit) ? [2, 3] : [0, 1];
  return opposite.every((index) => foundations[index] >= card.rank - 1);
};

const revealTop = (pile: Card[]) => {
  const top = pile[pile.length - 1];
  if (top && !top.faceUp) top.faceUp = true;
};

type Candidate = {
  state: SolverState;
  stats: MoveStats;
  priority: number;
};

const nextStats = (
  stats: MoveStats,
  changes: Partial<Pick<MoveStats, 'tableauMoves' | 'stockPasses' | 'forcedMoves'>> = {}
): MoveStats => ({
  moves: stats.moves + 1,
  tableauMoves: stats.tableauMoves + (changes.tableauMoves ?? 0),
  stockPasses: stats.stockPasses + (changes.stockPasses ?? 0),
  forcedMoves: stats.forcedMoves + (changes.forcedMoves ?? 0)
});

const createCandidates = (state: SolverState, stats: MoveStats, drawCount: 1 | 3) => {
  const candidates: Candidate[] = [];
  const topWaste = state.waste[state.waste.length - 1];

  if (topWaste && canMoveToFoundation(topWaste, state.foundations)) {
    const next = cloneSolverState(state);
    const card = next.waste.pop()!;
    next.foundations[suitIndex(card)] += 1;
    candidates.push({
      state: next,
      stats: nextStats(stats, { forcedMoves: isSafeFoundationMove(card, state.foundations) ? 1 : 0 }),
      priority: isSafeFoundationMove(card, state.foundations) ? 120 : 65
    });
  }

  for (let sourceIndex = 0; sourceIndex < state.tableau.length; sourceIndex += 1) {
    const source = state.tableau[sourceIndex];
    const top = source[source.length - 1];
    if (!top?.faceUp) continue;

    if (canMoveToFoundation(top, state.foundations)) {
      const next = cloneSolverState(state);
      const card = next.tableau[sourceIndex].pop()!;
      const revealsCard = next.tableau[sourceIndex].some((item) => !item.faceUp);
      revealTop(next.tableau[sourceIndex]);
      next.foundations[suitIndex(card)] += 1;
      candidates.push({
        state: next,
        stats: nextStats(stats, { forcedMoves: isSafeFoundationMove(card, state.foundations) ? 1 : 0 }),
        priority: (revealsCard ? 45 : 0) + (isSafeFoundationMove(card, state.foundations) ? 110 : 55)
      });
    }

    const firstFaceUp = source.findIndex((card) => card.faceUp);
    for (let cardIndex = firstFaceUp; cardIndex >= 0 && cardIndex < source.length; cardIndex += 1) {
      const moving = source.slice(cardIndex);
      const revealsCard = cardIndex > 0 && !source[cardIndex - 1].faceUp;
      for (let targetIndex = 0; targetIndex < state.tableau.length; targetIndex += 1) {
        if (targetIndex === sourceIndex) continue;
        const target = state.tableau[targetIndex];
        if (!canPlaceOnTableau(moving, target)) continue;
        if (target.length === 0 && cardIndex === 0 && !revealsCard) continue;
        const next = cloneSolverState(state);
        const moved = next.tableau[sourceIndex].splice(cardIndex);
        next.tableau[targetIndex].push(...moved);
        revealTop(next.tableau[sourceIndex]);
        candidates.push({
          state: next,
          stats: nextStats(stats, { tableauMoves: 1 }),
          priority: revealsCard ? 105 : target.length === 0 ? 70 : 45
        });
      }
    }
  }

  if (topWaste) {
    for (let targetIndex = 0; targetIndex < state.tableau.length; targetIndex += 1) {
      if (!canPlaceOnTableau([topWaste], state.tableau[targetIndex])) continue;
      const next = cloneSolverState(state);
      next.tableau[targetIndex].push(next.waste.pop()!);
      candidates.push({ state: next, stats: nextStats(stats, { tableauMoves: 1 }), priority: 80 });
    }
  }

  if (state.stock.length > 0) {
    const next = cloneSolverState(state);
    for (let index = 0; index < drawCount; index += 1) {
      const card = next.stock.pop();
      if (!card) break;
      card.faceUp = true;
      next.waste.push(card);
    }
    candidates.push({ state: next, stats: nextStats(stats), priority: 15 });
  } else if (state.waste.length > 0) {
    const next = cloneSolverState(state);
    next.stock = next.waste.map((card) => ({ ...card, faceUp: false })).reverse();
    next.waste = [];
    candidates.push({
      state: next,
      stats: nextStats(stats, { stockPasses: 1 }),
      priority: 5
    });
  }

  return candidates.sort((left, right) => right.priority - left.priority);
};

export const solveGame = (
  game: GameState,
  drawCount: 1 | 3,
  maxStates = 50_000
): SolveResult => {
  const initial: SolverState = {
    stock: cloneState(game).stock,
    waste: [],
    tableau: cloneState(game).tableau,
    foundations: [0, 0, 0, 0]
  };
  const visited = new Set<string>();
  let exploredStates = 0;
  let solution: MoveStats | null = null;

  const search = (state: SolverState, stats: MoveStats): boolean => {
    if (state.foundations.reduce((sum, rank) => sum + rank, 0) === 52) {
      solution = stats;
      return true;
    }
    if (exploredStates >= maxStates || stats.stockPasses > 8 || stats.moves > 220) return false;
    const key = stateKey(state);
    if (visited.has(key)) return false;
    visited.add(key);
    exploredStates += 1;

    for (const candidate of createCandidates(state, stats, drawCount)) {
      if (search(candidate.state, candidate.stats)) return true;
    }
    return false;
  };

  const emptyStats: MoveStats = { moves: 0, tableauMoves: 0, stockPasses: 0, forcedMoves: 0 };
  const solved = search(initial, emptyStats);
  const finalStats: MoveStats = solution ?? emptyStats;
  return { solved, exploredStates, ...finalStats };
};
