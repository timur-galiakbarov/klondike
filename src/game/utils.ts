import { Card, GameState, FoundationPile, Suit } from './types';

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

export const canPlaceOnFoundation = (card: Card, destination: FoundationPile): boolean => {
  if (!card) return false;
  if (destination.cards.length === 0) return card.rank === 1;
  const top = destination.cards[destination.cards.length - 1];
  return destination.suit === card.suit && card.rank === top.rank + 1;
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

const createEmptyFoundations = (): FoundationPile[] =>
  Array.from({ length: 4 }, () => ({ cards: [] }));

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
    foundations: createEmptyFoundations()
  };
};

export const isGameComplete = (state: GameState) =>
  state.foundations.every((pile) => pile.cards.length === 13);

const getTopClosedCardIndex = (pile: Card[]) => {
  for (let index = pile.length - 1; index >= 0; index -= 1) {
    if (!pile[index].faceUp) {
      return index;
    }
  }
  return -1;
};

export const hasVisibleMove = (state: GameState) => {
  const topWaste = state.waste[state.waste.length - 1];

  if (topWaste) {
    if (state.foundations.some((pile) => canPlaceOnFoundation(topWaste, pile))) {
      return true;
    }
    if (state.tableau.some((pile) => canPlaceOnTableau([topWaste], pile))) {
      return true;
    }
  }

  for (let sourceIndex = 0; sourceIndex < state.tableau.length; sourceIndex += 1) {
    const sourcePile = state.tableau[sourceIndex];
    if (sourcePile.length === 0) continue;

    for (let cardIndex = 0; cardIndex < sourcePile.length; cardIndex += 1) {
      const card = sourcePile[cardIndex];
      if (!card.faceUp) continue;

      if (
        cardIndex === sourcePile.length - 1 &&
        state.foundations.some((pile) => canPlaceOnFoundation(card, pile))
      ) {
        return true;
      }

      const movingCards = sourcePile.slice(cardIndex);
      for (let targetIndex = 0; targetIndex < state.tableau.length; targetIndex += 1) {
        if (targetIndex === sourceIndex) continue;
        if (canPlaceOnTableau(movingCards, state.tableau[targetIndex])) {
          return true;
        }
      }
    }
  }

  return false;
};

export const hasProgressMove = (state: GameState) => {
  const topWaste = state.waste[state.waste.length - 1];

  if (topWaste) {
    if (state.foundations.some((pile) => canPlaceOnFoundation(topWaste, pile))) {
      return true;
    }
    if (state.tableau.some((pile) => canPlaceOnTableau([topWaste], pile))) {
      return true;
    }
  }

  for (let sourceIndex = 0; sourceIndex < state.tableau.length; sourceIndex += 1) {
    const sourcePile = state.tableau[sourceIndex];
    if (sourcePile.length === 0) continue;

    for (let cardIndex = 0; cardIndex < sourcePile.length; cardIndex += 1) {
      const card = sourcePile[cardIndex];
      if (!card.faceUp) continue;

      if (
        cardIndex === sourcePile.length - 1 &&
        state.foundations.some((pile) => canPlaceOnFoundation(card, pile))
      ) {
        return true;
      }

      const movingCards = sourcePile.slice(cardIndex);
      const revealsFaceDownCard =
        cardIndex > 0 && sourcePile[cardIndex - 1] && !sourcePile[cardIndex - 1].faceUp;

      for (let targetIndex = 0; targetIndex < state.tableau.length; targetIndex += 1) {
        if (targetIndex === sourceIndex) continue;
        if (!canPlaceOnTableau(movingCards, state.tableau[targetIndex])) {
          continue;
        }

        if (revealsFaceDownCard) {
          return true;
        }
      }
    }
  }

  return false;
};

export const findRescueTableauIndex = (state: GameState) => {
  let bestIndex: number | null = null;
  let bestFaceDownCount = -1;
  let bestFaceUpCount = Number.POSITIVE_INFINITY;

  state.tableau.forEach((pile, index) => {
    const topClosedCardIndex = getTopClosedCardIndex(pile);
    if (topClosedCardIndex === -1) return;

    const faceDownCount = topClosedCardIndex + 1;
    const faceUpCount = pile.length - faceDownCount;

    if (
      faceDownCount > bestFaceDownCount ||
      (faceDownCount === bestFaceDownCount && faceUpCount < bestFaceUpCount)
    ) {
      bestIndex = index;
      bestFaceDownCount = faceDownCount;
      bestFaceUpCount = faceUpCount;
    }
  });

  return bestIndex;
};

export const revealRescueCard = (state: GameState) => {
  const tableauIndex = findRescueTableauIndex(state);
  if (tableauIndex === null) {
    return null;
  }

  const next = cloneState(state);
  const pile = next.tableau[tableauIndex];
  const topClosedCardIndex = getTopClosedCardIndex(pile);
  if (topClosedCardIndex === -1) {
    return null;
  }

  const [revealedCard] = pile.splice(topClosedCardIndex, 1);
  if (!revealedCard) {
    return null;
  }
  revealedCard.faceUp = true;
  pile.push(revealedCard);

  return {
    state: next,
    tableauIndex,
    cardId: revealedCard.id
  };
};
