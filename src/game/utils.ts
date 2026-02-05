import { Card, GameState, Suit } from './types';

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export const rankLabel = (rank: number) => {
  if (rank === 1) return 'A';
  if (rank === 11) return 'J';
  if (rank === 12) return 'Q';
  if (rank === 13) return 'K';
  return String(rank);
};

export const suitSymbol = (suit: Suit) => {
  switch (suit) {
    case 'hearts':
      return '♥';
    case 'diamonds':
      return '♦';
    case 'clubs':
      return '♣';
    case 'spades':
      return '♠';
  }
};

export const isRed = (suit: Suit) => suit === 'hearts' || suit === 'diamonds';

export const canPlaceOnTableau = (cards: Card[], destination: Card[]): boolean => {
  const movingCard = cards[0];
  if (!movingCard) return false;
  if (destination.length === 0) return movingCard.rank === 13;
  const top = destination[destination.length - 1];
  if (!top.faceUp) return false;
  const colorDiff = isRed(movingCard.suit) !== isRed(top.suit);
  return colorDiff && movingCard.rank === top.rank - 1;
};

export const canPlaceOnFoundation = (card: Card, destination: Card[]): boolean => {
  if (!card) return false;
  if (destination.length === 0) return card.rank === 1;
  const top = destination[destination.length - 1];
  return card.suit === top.suit && card.rank === top.rank + 1;
};

export const cloneState = (state: GameState): GameState => JSON.parse(JSON.stringify(state));

const buildDeck = (): Card[] => {
  const deck: Card[] = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => {
      deck.push({
        id: `${suit}-${rank}-${Math.random().toString(36).slice(2, 9)}`,
        suit,
        rank,
        faceUp: false
      });
    });
  });
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

export const dealGame = (): GameState => {
  const deck = buildDeck();
  const tableau: Card[][] = [];
  for (let i = 0; i < 7; i += 1) {
    const pile = deck.splice(0, i + 1);
    pile[pile.length - 1].faceUp = true;
    tableau.push(pile);
  }
  return {
    stock: deck,
    waste: [],
    wasteVisibleCount: 0,
    tableau,
    foundations: {
      hearts: [],
      diamonds: [],
      clubs: [],
      spades: []
    }
  };
};

export const isGameComplete = (state: GameState) =>
  SUITS.every((suit) => state.foundations[suit].length === 13);
