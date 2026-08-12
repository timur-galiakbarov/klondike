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

export const isGameComplete = (state: GameState) =>
  state.foundations.every((pile) => pile.cards.length === 13);

export const canAutoComplete = (state: GameState): boolean => {
  if (isGameComplete(state)) return false;

  const next = cloneState(state);

  const moveToFoundation = (card: Card) => {
    const foundation = next.foundations.find((pile) => canPlaceOnFoundation(card, pile));
    if (!foundation) return false;
    if (foundation.cards.length === 0) {
      foundation.suit = card.suit;
    }
    foundation.cards.push(card);
    return true;
  };

  while (!isGameComplete(next)) {
    const wasteCard = next.waste[next.waste.length - 1];
    if (wasteCard && moveToFoundation(wasteCard)) {
      next.waste.pop();
      continue;
    }

    let movedTableauCard = false;
    for (const pile of next.tableau) {
      const card = pile[pile.length - 1];
      if (!card?.faceUp || !moveToFoundation(card)) continue;
      pile.pop();
      movedTableauCard = true;
      break;
    }

    if (!movedTableauCard) return false;
  }

  return (
    next.stock.length === 0 &&
    next.waste.length === 0 &&
    next.tableau.every((pile) => pile.length === 0)
  );
};

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

const buildRescueCandidate = (state: GameState, tableauIndex: number) => {
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
    cardId: revealedCard.id,
    faceDownCount: topClosedCardIndex + 1,
    faceUpCount: pile.length - topClosedCardIndex - 1
  };
};

const rescueCreatesProgress = (state: GameState, tableauIndex: number, cardId: string) => {
  const rescuedPile = state.tableau[tableauIndex];
  const rescuedCard = rescuedPile[rescuedPile.length - 1];
  if (!rescuedCard || rescuedCard.id !== cardId) {
    return false;
  }

  if (state.foundations.some((foundation) => canPlaceOnFoundation(rescuedCard, foundation))) {
    return true;
  }

  const topWaste = state.waste[state.waste.length - 1];
  if (topWaste && canPlaceOnTableau([topWaste], rescuedPile)) {
    return true;
  }

  for (let sourceIndex = 0; sourceIndex < state.tableau.length; sourceIndex += 1) {
    const sourcePile = state.tableau[sourceIndex];
    for (let cardIndex = 0; cardIndex < sourcePile.length; cardIndex += 1) {
      const card = sourcePile[cardIndex];
      if (!card.faceUp) continue;

      const movingCards = sourcePile.slice(cardIndex);
      const revealsFaceDownCard =
        cardIndex > 0 && sourcePile[cardIndex - 1] && !sourcePile[cardIndex - 1].faceUp;
      if (!revealsFaceDownCard) continue;

      const movesRescuedCard = movingCards.some((movingCard) => movingCard.id === cardId);
      for (let targetIndex = 0; targetIndex < state.tableau.length; targetIndex += 1) {
        if (targetIndex === sourceIndex) continue;
        if (!movesRescuedCard && targetIndex !== tableauIndex) continue;
        if (canPlaceOnTableau(movingCards, state.tableau[targetIndex])) {
          return true;
        }
      }
    }
  }

  return false;
};

export const revealRescueCard = (state: GameState) => {
  let bestRescue: ReturnType<typeof buildRescueCandidate> = null;
  let fallbackRescue: ReturnType<typeof buildRescueCandidate> = null;

  for (let index = 0; index < state.tableau.length; index += 1) {
    const pile = state.tableau[index];
    if (!pile.some((card) => !card.faceUp)) continue;

    const rescue = buildRescueCandidate(state, index);
    if (!rescue) continue;

    if (
      !fallbackRescue ||
      rescue.faceDownCount > fallbackRescue.faceDownCount ||
      (rescue.faceDownCount === fallbackRescue.faceDownCount &&
        rescue.faceUpCount < fallbackRescue.faceUpCount)
    ) {
      fallbackRescue = rescue;
    }

    if (rescueCreatesProgress(rescue.state, rescue.tableauIndex, rescue.cardId)) {
      if (
        !bestRescue ||
        rescue.faceDownCount > bestRescue.faceDownCount ||
        (rescue.faceDownCount === bestRescue.faceDownCount &&
          rescue.faceUpCount < bestRescue.faceUpCount)
      ) {
        bestRescue = rescue;
      }
    }
  }

  const rescue = bestRescue ?? fallbackRescue;

  if (!rescue) {
    return null;
  }

  return {
    state: rescue.state,
    tableauIndex: rescue.tableauIndex,
    cardId: rescue.cardId
  };
};
