import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  PanResponder,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CardBack } from '../components/CardBack';
import { CardView } from '../components/CardView';
import { Pile } from '../components/Pile';
import { IconButton, SecondaryButton } from '../components/Buttons';
import { triggerHaptic } from '../utils/haptics';
import { formatTime } from '../utils/time';
import {
  canPlaceOnFoundation,
  canPlaceOnTableau,
  dealGame,
  cloneState,
  isGameComplete
} from '../game/utils';
import { Card, DragSource, DragState, FoundationPile, GameState, Rect } from '../game/types';
import { GameSettings } from '../hooks/useSettings';
import { CARD_HEIGHT, CARD_WIDTH, GAP, PADDING, TABLEAU_STACK_STEP } from '../game/constants';
import { YandexBanner } from '../components/YandexBanner';
import { VictoryBanner } from '../components/VictoryBanner';
import { useAnalytics } from '../hooks/useAnalytics';

const FACE_DOWN_STACK_STEP = 12;

const getStackHeightForPile = (pile: Card[]) => {
  if (pile.length === 0) return CARD_HEIGHT;
  let height = CARD_HEIGHT;
  for (let i = 0; i < pile.length - 1; i += 1) {
    height += pile[i].faceUp ? TABLEAU_STACK_STEP : FACE_DOWN_STACK_STEP;
  }
  return height;
};

const getCardOffsetYForPile = (pile: Card[], cardIndex: number) => {
  let y = 0;
  for (let i = 0; i < cardIndex; i += 1) {
    y += pile[i].faceUp ? TABLEAU_STACK_STEP : FACE_DOWN_STACK_STEP;
  }
  return y;
};

const findFoundationIndexForCard = (card: Card, foundations: FoundationPile[]): number | null => {
  const sameSuit = foundations.findIndex((pile) => pile.cards.length > 0 && pile.suit === card.suit);
  if (sameSuit !== -1) return sameSuit;
  if (card.rank !== 1) return null;
  const emptyIndex = foundations.findIndex((pile) => pile.cards.length === 0);
  return emptyIndex !== -1 ? emptyIndex : null;
};

const addCardToFoundation = (pile: FoundationPile, card: Card) => {
  if (pile.cards.length === 0) {
    pile.suit = card.suit;
  }
  pile.cards.push(card);
};

const popCardFromFoundation = (pile: FoundationPile) => {
  const card = pile.cards.pop();
  if (pile.cards.length === 0) {
    pile.suit = undefined;
  }
  return card;
};

export type SavedGame = {
  initialState: GameState;
  state: GameState;
  history: GameState[];
  seconds: number;
  completed: boolean;
  drawCount: 1 | 3;
};

type CollectingCard = {
  card: Card;
  position: Animated.ValueXY;
  width: number;
  height: number;
};

type HintMove = {
  cards: Card[];
  fromRect: Rect;
  targetRect: Rect;
};

type CollectMove = {
  source: 'waste' | 'tableau';
  pileIndex?: number;
  card: Card;
};

export const GameScreen = ({
  onBack,
  onComplete,
  settings,
  resume,
  onSaveGame,
  onClearSaved
}: {
  onBack: () => void;
  onComplete: (seconds: number, moves: number) => void;
  settings: GameSettings;
  resume?: SavedGame | null;
  onSaveGame: (data: SavedGame) => void;
  onClearSaved: () => void;
}) => {
  const EDGE_GUARD = 24;
  const initialStateRef = useRef<GameState>(
    resume ? cloneState(resume.initialState) : dealGame()
  );
  const [state, setState] = useState<GameState>(() =>
    resume ? cloneState(resume.state) : cloneState(initialStateRef.current)
  );
  const [history, setHistory] = useState<GameState[]>(() =>
    resume ? resume.history.map((item) => cloneState(item)) : []
  );
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [completed, setCompleted] = useState(() => (resume ? resume.completed : false));
  const [showVictoryBanner, setShowVictoryBanner] = useState(false);
  const [seconds, setSeconds] = useState(() => (resume ? resume.seconds : 0));
  const [hoverTarget, setHoverTarget] = useState<
    | { type: 'tableau'; index: number }
    | { type: 'foundation'; index: number }
    | null
  >(null);
  const [autoRunning, setAutoRunning] = useState(false);
  const [collectingCards, setCollectingCards] = useState<CollectingCard[]>([]);
  const [hintingCardIds, setHintingCardIds] = useState<string[]>([]);
  const hintTransformsRef = useRef<Record<string, Animated.ValueXY>>({});
  const [isHinting, setIsHinting] = useState(false);
  const [hintMessage, setHintMessage] = useState('');
  const [hintCycleIndex, setHintCycleIndex] = useState(0);
  const hintMessageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHintSignature = useRef('');
  const collectingIds = useRef(new Set<string>());
  const isCollecting = useCallback((cardId: string) => collectingIds.current.has(cardId), []);
  const didInitRef = useRef(false);
  const canHaptics = settings.hapticsEnabled;
  const isAnimatingRef = useRef(false);
  const { sendAnalytics } = useAnalytics();
  const insets = useSafeAreaInsets();
  const [gameDrawCount, setGameDrawCount] = useState<1 | 3>(
    resume ? resume.drawCount : settings.drawCount
  );

  const cardLayouts = useRef<Record<string, Rect>>({});
  const tableauLayouts = useRef<Record<number, Rect>>({});
  const foundationLayouts = useRef<Record<number, Rect>>({} as Record<number, Rect>);
  const draggingRef = useRef(false);
  const didDragRef = useRef(false);
  const gameLayoutRef = useRef<Rect | null>(null);
  const pendingDragRef = useRef<{
    source: DragSource;
    cardId: string;
    startX: number;
    startY: number;
    rect?: Rect;
  } | null>(null);
  const hoverTargetRef = useRef<
    | { type: 'tableau'; index: number }
    | { type: 'foundation'; index: number }
    | null
  >(null);
  const dragPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  useEffect(() => {
    if (!completed && isGameComplete(state)) {
      setCompleted(true);
      onClearSaved();
      onComplete(seconds, history.length);
      // Показываем победный баннер с небольшой задержкой
      setTimeout(() => {
        setShowVictoryBanner(true);
      }, 500);
    }
  }, [state, completed, history.length, onComplete, seconds, onClearSaved]);

  useEffect(() => {
    if (!resume || didInitRef.current) return;
    didInitRef.current = true;
    initialStateRef.current = cloneState(resume.initialState);
    setState(cloneState(resume.state));
    setHistory(resume.history.map((item) => cloneState(item)));
    setSeconds(resume.seconds);
    setCompleted(resume.completed);
    setGameDrawCount(resume.drawCount);
    setAutoRunning(false);
    setDragging(null);
    setHoverTarget(null);
    pendingDragRef.current = null;
    draggingRef.current = false;
    didDragRef.current = false;
    hoverTargetRef.current = null;
    dragPosition.setValue({ x: 0, y: 0 });
  }, [resume, dragPosition]);

  useEffect(() => {
    if (completed) return;
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [completed]);

  const pushHistory = useCallback(
    (next: GameState) => {
      setHistory((prev) => [...prev, cloneState(state)]);
      setState(next);
    },
    [state]
  );

  const drawFromStock = () => {
    if (state.stock.length === 0 && state.waste.length === 0) return;
    const next = cloneState(state);
    if (next.stock.length === 0) {
      next.stock = next.waste.map((card) => ({ ...card, faceUp: false })).reverse();
      next.waste = [];
      next.wasteVisibleCount = 0;
      pushHistory(next);
      return;
    }
    const drawCount = gameDrawCount;
    for (let i = 0; i < drawCount; i += 1) {
      const card = next.stock.pop();
      if (!card) break;
      card.faceUp = true;
      next.waste.push(card);
    }
    next.wasteVisibleCount = Math.min(drawCount, next.waste.length);
    pushHistory(next);
  };

  const undo = () => {
    sendAnalytics('cancelStep');
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setState(last);
      return prev.slice(0, -1);
    });
  };

  const getStackHeight = useCallback((pile: Card[]) => getStackHeightForPile(pile), []);

  const getCardOffsetY = useCallback(
    (pile: Card[], cardIndex: number) => getCardOffsetYForPile(pile, cardIndex),
    []
  );

  const resetGame = () => {
    sendAnalytics('restartGameFromScreen');
    draggingRef.current = false;
    didDragRef.current = false;
    pendingDragRef.current = null;
    hoverTargetRef.current = null;
    setHoverTarget(null);
    setDragging(null);
    setAutoRunning(false);
    setCompleted(false);
    setShowVictoryBanner(false);
    setSeconds(0);
    setHistory([]);
    setState(cloneState(initialStateRef.current));
    dragPosition.setValue({ x: 0, y: 0 });
  };

  const startNewGame = () => {
    sendAnalytics('newGameFromGameScreen');
    initialStateRef.current = dealGame();
    onClearSaved();
    setShowVictoryBanner(false);
    setGameDrawCount(settings.drawCount);
    resetGame();
  };

  const handleExitToMenu = () => {
    if (!completed) {
      onSaveGame({
        initialState: cloneState(initialStateRef.current),
        state: cloneState(state),
        history: history.map((item) => cloneState(item)),
        seconds,
        completed,
        drawCount: gameDrawCount
      });
    } else {
      onClearSaved();
    }
    onBack();
  };

  const handleVictoryNewGame = () => {
    setShowVictoryBanner(false);
    startNewGame();
  };

  const beginDrag = (
    source: DragSource,
    cardId: string,
    pageX: number,
    pageY: number,
    rectOverride?: Rect
  ) => {
    const rect =
      rectOverride ??
      cardLayouts.current[cardId] ??
      ({
        x: pageX - CARD_WIDTH / 2,
        y: pageY - CARD_HEIGHT / 2,
        width: CARD_WIDTH,
        height: CARD_HEIGHT
      } as Rect);

    let cards: Card[] = [];
    if (source.type === 'tableau') {
      const pile = state.tableau[source.index];
      cards = pile.slice(source.cardIndex);
    } else if (source.type === 'waste') {
      if (state.wasteVisibleCount === 0) return;
      const card = state.waste[state.waste.length - 1];
      if (card) cards = [card];
    } else if (source.type === 'foundation') {
      const pile = state.foundations[source.index];
      const card = pile.cards[pile.cards.length - 1];
      if (card) cards = [card];
    }

    if (cards.length === 0) return;

    const gameRect = gameLayoutRef.current;
    const localX = gameRect ? pageX - gameRect.x : pageX;
    const localY = gameRect ? pageY - gameRect.y : pageY;

    draggingRef.current = true;
    didDragRef.current = true;
    pendingDragRef.current = null;
    hoverTargetRef.current = null;
    setHoverTarget(null);
    setDragging({
      source,
      cards,
      offset: { x: pageX - rect.x, y: pageY - rect.y }
    });
    dragPosition.setValue({ x: localX, y: localY });
  };

  const beginDragIntent = (
    source: DragSource,
    cardId: string,
    pageX: number,
    pageY: number,
    rect?: Rect
  ) => {
    pendingDragRef.current = { source, cardId, startX: pageX, startY: pageY, rect };
  };

  const endDrag = (pageX: number, pageY: number) => {
    if (!dragging) return;
    const target = hoverTargetRef.current;
    const next = cloneState(state);
    let moved = false;

    if (target?.type === 'tableau') {
      if (dragging.source.type === 'tableau' && dragging.source.index === target.index) {
        setDragging(null);
        setHoverTarget(null);
        return;
      }
      const dest = next.tableau[target.index];
      if (canPlaceOnTableau(dragging.cards, dest)) {
        if (dragging.source.type === 'tableau') {
          const fromPile = next.tableau[dragging.source.index];
          const moving = fromPile.splice(dragging.source.cardIndex);
          dest.push(...moving);
          if (fromPile.length > 0) fromPile[fromPile.length - 1].faceUp = true;
        } else if (dragging.source.type === 'waste') {
          const card = next.waste.pop();
          if (card) {
            dest.push(card);
            if (next.wasteVisibleCount > 1) {
              next.wasteVisibleCount -= 1;
            } else {
              next.wasteVisibleCount = next.waste.length > 0 ? 1 : 0;
            }
          }
        } else if (dragging.source.type === 'foundation') {
          const fromPile = next.foundations[dragging.source.index];
          const card = popCardFromFoundation(fromPile);
          if (card) dest.push(card);
        }
        moved = true;
      }
    }

    if (target?.type === 'foundation' && dragging.cards.length === 1) {
      if (
        dragging.source.type === 'foundation' &&
        dragging.source.index === target.index
      ) {
        setDragging(null);
        setHoverTarget(null);
        return;
      }
      const dest = next.foundations[target.index];
      if (canPlaceOnFoundation(dragging.cards[0], dest)) {
        if (dragging.source.type === 'tableau') {
          const fromPile = next.tableau[dragging.source.index];
          const card = fromPile.pop();
          if (card) {
            addCardToFoundation(dest, card);
          }
          if (fromPile.length > 0) fromPile[fromPile.length - 1].faceUp = true;
        } else if (dragging.source.type === 'waste') {
          const card = next.waste.pop();
          if (card) {
            addCardToFoundation(dest, card);
            if (next.wasteVisibleCount > 1) {
              next.wasteVisibleCount -= 1;
            } else {
              next.wasteVisibleCount = next.waste.length > 0 ? 1 : 0;
            }
          }
        } else if (dragging.source.type === 'foundation') {
          const fromPile = next.foundations[dragging.source.index];
          if (dragging.source.index !== target.index) {
            const card = popCardFromFoundation(fromPile);
            if (card) {
              addCardToFoundation(dest, card);
            }
          }
        }
        moved = true;
      }
    }

    const finalizeDrag = () => {
      draggingRef.current = false;
      pendingDragRef.current = null;
      hoverTargetRef.current = null;
      setDragging(null);
      setHoverTarget(null);
      setTimeout(() => {
        didDragRef.current = false;
      }, 0);
    };

    if (moved && target && gameLayoutRef.current) {
      const gameRect = gameLayoutRef.current;
      let targetX = 0;
      let targetY = 0;
      let hasTargetPos = false;
      if (target.type === 'tableau') {
        const rect = tableauLayouts.current[target.index];
        if (rect) {
          const pileTopX = rect.x - gameRect.x;
          const pileTopY = rect.y - gameRect.y;
          const dest = state.tableau[target.index];
          targetX = pileTopX;
          targetY = pileTopY + getCardOffsetYForPile(dest, dest.length);
          hasTargetPos = true;
        }
      } else if (target.type === 'foundation') {
        const rect = foundationLayouts.current[target.index];
        if (rect) {
          targetX = rect.x - gameRect.x;
          targetY = rect.y - gameRect.y;
          hasTargetPos = true;
        }
      }

      if (hasTargetPos) {
        isAnimatingRef.current = true;
        const toValue = {
          x: targetX + dragging.offset.x,
          y: targetY + dragging.offset.y
        };
        Animated.timing(dragPosition, {
          toValue,
          duration: 160,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }).start(() => {
          pushHistory(next);
          if (canHaptics) triggerHaptic();
          isAnimatingRef.current = false;
          finalizeDrag();
        });
        return;
      }
    }

    if (moved) {
      pushHistory(next);
      if (canHaptics) triggerHaptic();
    }

    const gameRect = gameLayoutRef.current;
    const localX = gameRect ? pageX - gameRect.x : pageX;
    const localY = gameRect ? pageY - gameRect.y : pageY;
    dragPosition.setValue({ x: localX, y: localY });
    finalizeDrag();
  };

  const runCollectAnimation = (
    card: Card,
    fromRect: Rect,
    toRect: Rect,
    onComplete: () => void
  ) => {
    const gameRect = gameLayoutRef.current;
    if (!gameRect) {
      onComplete();
      return;
    }
    const position = new Animated.ValueXY({
      x: fromRect.x - gameRect.x,
      y: fromRect.y - gameRect.y
    });
    collectingIds.current.add(card.id);
    setCollectingCards((prev) => [
      ...prev,
      { card, position, width: fromRect.width, height: fromRect.height }
    ]);
    Animated.timing(position, {
      toValue: { x: toRect.x - gameRect.x, y: toRect.y - gameRect.y },
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start(() => {
      collectingIds.current.delete(card.id);
      setCollectingCards((prev) => prev.filter((entry) => entry.card.id !== card.id));
      onComplete();
    });
  };

  const runHintAnimation = (move: HintMove, onComplete: () => void) => {
    const gameRect = gameLayoutRef.current;
    if (!gameRect) {
      onComplete();
      return;
    }
    const startValue = {
      x: move.fromRect.x - gameRect.x,
      y: move.fromRect.y - gameRect.y
    };
    const targetValue = {
      x: move.targetRect.x - gameRect.x,
      y: move.targetRect.y - gameRect.y
    };
    const delta = {
      x: targetValue.x - startValue.x,
      y: targetValue.y - startValue.y
    };
    const animation = new Animated.ValueXY({ x: 0, y: 0 });
    const cardIds = move.cards.map((card) => card.id);
    cardIds.forEach((cardId) => {
      hintTransformsRef.current[cardId] = animation;
    });
    setHintingCardIds(cardIds);
    Animated.sequence([
      Animated.timing(animation, {
        toValue: delta,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.delay(80),
      Animated.timing(animation, {
        toValue: { x: 0, y: 0 },
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true
      })
    ]).start(() => {
      cardIds.forEach((cardId) => {
        delete hintTransformsRef.current[cardId];
      });
      setHintingCardIds([]);
      onComplete();
    });
  };

  const showHintMessage = (message: string) => {
    setHintMessage(message);
    if (hintMessageTimer.current) {
      clearTimeout(hintMessageTimer.current);
    }
    hintMessageTimer.current = setTimeout(() => {
      setHintMessage('');
      hintMessageTimer.current = null;
    }, 2000);
  };

  const collectFromSource = (source: DragSource, animated = false, cardId?: string) => {
    if (source.type === 'foundation') return false;
    let cardToMove: Card | undefined;
    if (source.type === 'tableau') {
      const fromPile = state.tableau[source.index];
      if (source.cardIndex !== fromPile.length - 1) return false;
      const card = fromPile[fromPile.length - 1];
      if (!card?.faceUp) return false;
      cardToMove = card;
    } else {
      if (state.wasteVisibleCount === 0) return false;
      const card = state.waste[state.waste.length - 1];
      if (!card) return false;
      cardToMove = card;
    }
    const foundationIndex = findFoundationIndexForCard(cardToMove, state.foundations);
    if (foundationIndex === null) return false;
    const foundationDest = state.foundations[foundationIndex];
    if (!canPlaceOnFoundation(cardToMove, foundationDest)) return false;

    const next = cloneState(state);
    if (source.type === 'tableau') {
      const pile = next.tableau[source.index];
      const moving = pile.pop();
      if (moving) {
        if (pile.length > 0) {
          pile[pile.length - 1].faceUp = true;
        }
        addCardToFoundation(next.foundations[foundationIndex], moving);
      }
    } else {
      const moving = next.waste.pop();
      if (moving) {
        addCardToFoundation(next.foundations[foundationIndex], moving);
        if (next.wasteVisibleCount > 1) {
          next.wasteVisibleCount -= 1;
        } else {
          next.wasteVisibleCount = next.waste.length > 0 ? 1 : 0;
        }
      }
    }
    const completeState = () => {
      pushHistory(next);
    };
    const playHaptics = () => {
      if (canHaptics) triggerHaptic();
    };
    if (animated) {
      const layout =
        (cardId && cardLayouts.current[cardId]) ?? cardLayouts.current[cardToMove.id];
      const target = foundationLayouts.current[foundationIndex];
      if (layout && target) {
        runCollectAnimation(cardToMove, layout, target, () => {
          completeState();
          playHaptics();
        });
        return true;
      }
    }
    completeState();
    playHaptics();
    return true;
  };

  const getTableauDropRect = (index: number, pile: Card[]): Rect | null => {
    const layout = tableauLayouts.current[index];
    if (!layout) return null;
    const offsetY = getCardOffsetYForPile(pile, pile.length);
    return {
      x: layout.x,
      y: layout.y + offsetY,
      width: layout.width,
      height: CARD_HEIGHT
    };
  };

  const canAutoFinish = useMemo(() => {
    const noStock = state.stock.length === 0;
    const allFaceUp = state.tableau.every((pile) => pile.every((card) => card.faceUp));
    return noStock && allFaceUp && !autoRunning;
  }, [state, autoRunning]);

  const autoFinish = async () => {
    if (autoRunning) return;
    setAutoRunning(true);
    let next = cloneState(state);
    const moveOne = () => {
      if (next.waste.length > 0) {
        const card = next.waste[next.waste.length - 1];
        const targetIdx = findFoundationIndexForCard(card, next.foundations);
        if (targetIdx !== null) {
          const dest = next.foundations[targetIdx];
          if (canPlaceOnFoundation(card, dest)) {
            next.waste.pop();
            addCardToFoundation(dest, card);
            return true;
          }
        }
      }
      for (let i = 0; i < next.tableau.length; i += 1) {
        const pile = next.tableau[i];
        if (pile.length === 0) continue;
        const card = pile[pile.length - 1];
        if (!card.faceUp) continue;
        const targetIdx = findFoundationIndexForCard(card, next.foundations);
        if (targetIdx === null) continue;
        const dest = next.foundations[targetIdx];
        if (canPlaceOnFoundation(card, dest)) {
          pile.pop();
          addCardToFoundation(dest, card);
          return true;
        }
      }
      return false;
    };

    while (moveOne()) {
      setState(cloneState(next));
      if (canHaptics) triggerHaptic();
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    setAutoRunning(false);
  };

  useEffect(() => {
    return () => {
      if (hintMessageTimer.current) {
        clearTimeout(hintMessageTimer.current);
        hintMessageTimer.current = null;
      }
    };
  }, []);

  useEffect(() => {
    lastHintSignature.current = '';
    setHintCycleIndex(0);
  }, [state]);

  const findHintMoves = (): HintMove[] => {
    const moves: HintMove[] = [];
    const addMove = (cards: Card[], fromRect: Rect, targetRect: Rect) => {
      moves.push({ cards, fromRect, targetRect });
    };

    const topWaste = state.waste[state.waste.length - 1];
    if (topWaste) {
      const layout = cardLayouts.current[topWaste.id];
      if (layout) {
        state.foundations.forEach((pile, index) => {
          const foundationRect = foundationLayouts.current[index];
          if (!foundationRect) return;
          if (canPlaceOnFoundation(topWaste, pile)) {
            addMove([topWaste], layout, foundationRect);
          }
        });
        for (let i = 0; i < state.tableau.length; i += 1) {
          const pile = state.tableau[i];
          if (canPlaceOnTableau([topWaste], pile)) {
            const targetRect = getTableauDropRect(i, pile);
            if (targetRect) {
              addMove([topWaste], layout, targetRect);
            }
          }
        }
      }
    }

    for (let sourceIndex = 0; sourceIndex < state.tableau.length; sourceIndex += 1) {
      const pile = state.tableau[sourceIndex];
      if (pile.length === 0) continue;
      for (let cardIndex = 0; cardIndex < pile.length; cardIndex += 1) {
        const card = pile[cardIndex];
        if (!card.faceUp) continue;
        const layout = cardLayouts.current[card.id];
        if (!layout) continue;
        if (cardIndex === pile.length - 1) {
          state.foundations.forEach((foundation, index) => {
            const foundationRect = foundationLayouts.current[index];
            if (!foundationRect) return;
            if (canPlaceOnFoundation(card, foundation)) {
              addMove([card], layout, foundationRect);
            }
          });
        }
        const movingCards = pile.slice(cardIndex);
        for (let targetIndex = 0; targetIndex < state.tableau.length; targetIndex += 1) {
          if (targetIndex === sourceIndex) continue;
          const dest = state.tableau[targetIndex];
          if (canPlaceOnTableau(movingCards, dest)) {
            const targetRect = getTableauDropRect(targetIndex, dest);
            if (targetRect) {
              addMove(movingCards, layout, targetRect);
            }
          }
        }
      }
    }

    return moves;
  };

  const handleHint = () => {
    if (isHinting) return;
    sendAnalytics('userCallAdvice');
    const moves = findHintMoves();
    if (moves.length === 0) {
      showHintMessage('Нет доступных перемещений');
      return;
    }
    const signature = moves
      .map(
        (move) =>
          `${move.targetRect.x}-${move.targetRect.y}-${move.cards
            .map((card) => card.id)
            .join('-')}`
      )
      .join('|');
    let currentIndex = hintCycleIndex;
    if (signature !== lastHintSignature.current) {
      lastHintSignature.current = signature;
      currentIndex = 0;
      setHintCycleIndex(moves.length > 0 ? 1 % moves.length : 0);
    } else {
      setHintCycleIndex((prev) => (prev + 1) % moves.length);
    }
    const move = moves[currentIndex % moves.length];
    setIsHinting(true);
    runHintAnimation(move, () => setIsHinting(false));
  };

  const handleTap = (source: DragSource, cardId: string) => {
    if (didDragRef.current) return;
    collectFromSource(source, true, cardId);
  };

  const isRightHanded = settings.handOrientation === 'right';
  const isThreeCardDraw = gameDrawCount === 3;
  const wasteDirectionMultiplier =
    isRightHanded || isThreeCardDraw ? 1 : -1;
  const wasteCardXGap = isThreeCardDraw ? 18 : 22;
  const wasteCardYOffset = isThreeCardDraw ? 2 : 6;
  const wasteCardRotationStep = isThreeCardDraw ? 4 : 0;
  const wasteRotationSign = wasteDirectionMultiplier;
  const baseWasteStockGap = isThreeCardDraw ? 72 : 40;
  const rightHandSingleReduction = !isThreeCardDraw && isRightHanded ? 36 : 0;
  const wasteStockGap = isRightHanded
    ? Math.max(baseWasteStockGap - rightHandSingleReduction, 0)
    : Math.max(baseWasteStockGap - 60, 0);
  const isDraggingWasteCard = dragging?.source.type === 'waste';
  const visibleWasteBase =
    state.wasteVisibleCount > 0 ? state.waste.slice(-state.wasteVisibleCount) : [];
  const topVisibleWasteCardId =
    visibleWasteBase.length > 0 ? visibleWasteBase[visibleWasteBase.length - 1].id : undefined;
  const shouldRevealPreviousWasteCard =
    (isDraggingWasteCard || (topVisibleWasteCardId ? isCollecting(topVisibleWasteCardId) : false)) &&
    visibleWasteBase.length < 2 &&
    state.waste.length > visibleWasteBase.length;
  const previousWasteCardIndex = state.waste.length - visibleWasteBase.length - 1;
  const previousWasteCard =
    shouldRevealPreviousWasteCard && previousWasteCardIndex >= 0
      ? state.waste[previousWasteCardIndex]
      : undefined;
  const visibleWaste = previousWasteCard ? [previousWasteCard, ...visibleWasteBase] : visibleWasteBase;

  const stockPile = (
    <Pile label="" highlight={false}>
      <TouchableOpacity onPress={drawFromStock} activeOpacity={0.8}>
        {state.stock.length === 0 ? (
          <View style={[styles.card, styles.emptySlot]}>
            <Text style={styles.emptyText}>↻</Text>
          </View>
        ) : (
          <CardBack />
        )}
      </TouchableOpacity>
    </Pile>
  );

  const wasteStackSpacingStyle = isRightHanded
    ? { marginRight: wasteStockGap }
    : { marginLeft: wasteStockGap };

  const wastePile = (
    <Pile label="" highlight={false}>
      {visibleWaste.length === 0 ? (
        <View style={[styles.card, styles.emptySlot]} />
      ) : (
        <View style={[styles.wasteStack, wasteStackSpacingStyle]}>
          {visibleWaste
            .map((card, idx, arr) => {
              const isTop = idx === arr.length - 1;
              const isDraggingTop =
                isTop && !!dragging?.cards.some((d) => d.id === card.id);
              const isCollectingCard = isCollecting(card.id);
              const hintTransform = hintTransformsRef.current[card.id];
              return (
                <Animated.View
                  key={card.id}
                  style={[
                    styles.wasteCard,
                    {
                      transform: [
                        { translateX: idx * wasteCardXGap * wasteDirectionMultiplier },
                        { translateY: idx * wasteCardYOffset },
                        {
                          rotate:
                            wasteCardRotationStep === 0
                              ? '0deg'
                              : `${(idx - arr.length / 2) *
                              wasteCardRotationStep *
                              wasteRotationSign}deg`
                        },
                        ...(hintTransform ? hintTransform.getTranslateTransform() : [])
                      ]
                    },
                    hintingCardIds.includes(card.id) ? styles.hintingCard : undefined
                  ]}
                >
                  <CardView
                    card={card}
                    onLayout={(rect) => {
                      if (isTop) cardLayouts.current[card.id] = rect;
                    }}
                    onStart={(pageX, pageY, rect) => {
                      if (!isTop || isDraggingTop) return;
                      beginDragIntent({ type: 'waste' }, card.id, pageX, pageY, rect);
                    }}
                    onTap={() => {
                      if (!isTop || isDraggingTop) return;
                      pendingDragRef.current = null;
                      handleTap({ type: 'waste' }, card.id);
                    }}
                    hidden={isDraggingTop || isCollectingCard}
                    disabled={isDraggingTop || isCollectingCard}
                    ghost={isDraggingTop}
                  />
                </Animated.View>
              );
            })}
        </View>
      )}
    </Pile>
  );

  const stockSection = (
    <View style={styles.stockRow}>
      {isRightHanded ? wastePile : stockPile}
      {isRightHanded ? stockPile : wastePile}
    </View>
  );

  const foundationSection = (
    <View style={styles.foundationRow}>
      {state.foundations.map((pile, index) => {
        const topCard = pile.cards[pile.cards.length - 1];
        const isDraggingTopCard =
          !!topCard && dragging?.cards.some((card) => card.id === topCard.id);
        const shouldShowPlaceholder = pile.cards.length === 0 || isDraggingTopCard;
        const foundationHintTransform = topCard
          ? hintTransformsRef.current[topCard.id]
          : undefined;
        return (
          <Pile
            key={`foundation-${index}`}
            label=""
            onLayout={(rect) => (foundationLayouts.current[index] = rect)}
            highlight={hoverTarget?.type === 'foundation' && hoverTarget.index === index}
          >
            <View style={styles.foundationSlot}>
              <View
                style={[
                  styles.card,
                  styles.emptySlot,
                  shouldShowPlaceholder
                    ? styles.foundationPlaceholderVisible
                    : styles.foundationPlaceholderHidden
                ]}
              >
                {shouldShowPlaceholder && (
                  <Text style={styles.foundationPlaceholderLetter}>A</Text>
                )}
              </View>
              {topCard && (
                <Animated.View
                  style={[
                    foundationHintTransform
                      ? { transform: foundationHintTransform.getTranslateTransform() }
                      : undefined,
                    hintingCardIds.includes(topCard.id) ? styles.hintingCard : undefined
                  ]}
                >
                  <CardView
                    card={topCard}
                    onLayout={(rect) => {
                      cardLayouts.current[topCard.id] = rect;
                    }}
                    onStart={(pageX, pageY, rect) =>
                      beginDragIntent(
                        { type: 'foundation', index },
                        topCard.id,
                        pageX,
                        pageY,
                        rect
                      )
                    }
                    onTap={() => {
                      pendingDragRef.current = null;
                      handleTap({ type: 'foundation', index }, topCard.id);
                    }}
                    hidden={isDraggingTopCard}
                  />
                </Animated.View>
              )}
            </View>
          </Pile>
        );
      })}
    </View>
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponderCapture: () =>
          !isAnimatingRef.current && (draggingRef.current || !!pendingDragRef.current),
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          !isAnimatingRef.current &&
          (draggingRef.current ||
            !!pendingDragRef.current ||
            (gesture.x0 <= EDGE_GUARD && Math.abs(gesture.dx) > 6)),
        onMoveShouldSetPanResponder: () =>
          !isAnimatingRef.current && (draggingRef.current || !!pendingDragRef.current),
        onPanResponderMove: (_, gesture) => {
          if (!draggingRef.current && pendingDragRef.current) {
            const { startX, startY, source, cardId, rect } = pendingDragRef.current;
            const dx = gesture.moveX - startX;
            const dy = gesture.moveY - startY;
            if (Math.hypot(dx, dy) >= 6) {
              beginDrag(source, cardId, gesture.moveX, gesture.moveY, rect);
            } else {
              return;
            }
          }
          if (!draggingRef.current || !dragging) return;
          const { moveX, moveY } = gesture;
          const gameRect = gameLayoutRef.current;
          const localX = gameRect ? moveX - gameRect.x : moveX;
          const localY = gameRect ? moveY - gameRect.y : moveY;
          dragPosition.setValue({ x: localX, y: localY });
          const target = findHoverTarget(moveX, moveY, dragging.cards, state, {
            tableau: tableauLayouts.current,
            foundations: foundationLayouts.current
          });
          hoverTargetRef.current = target;
          setHoverTarget(target);
        },
        onPanResponderRelease: (_, gesture) => {
          if (!draggingRef.current && pendingDragRef.current) {
            const { cardId, source } = pendingDragRef.current;
            pendingDragRef.current = null;
            handleTap(source, cardId);
            return;
          }
          endDrag(gesture.moveX, gesture.moveY);
        },
        onPanResponderTerminate: (_, gesture) => endDrag(gesture.moveX, gesture.moveY),
        onPanResponderTerminationRequest: () => false
      }),
    [dragging, state]
  );

  return (
    <View
      style={styles.container}
      {...panResponder.panHandlers}
      onLayout={(event) => {
        event.currentTarget.measureInWindow((x, y, width, height) => {
          gameLayoutRef.current = { x, y, width, height };
        });
      }}
    >
      <ImageBackground
        source={require('../../assets/bg3.png')}
        style={[
          styles.gameBackground,
          { top: -insets.top, bottom: -insets.bottom }
        ]}
        imageStyle={[
          styles.backgroundImage,
          { top: -insets.top, bottom: -insets.bottom }
        ]}
        resizeMode="stretch"
        pointerEvents="none"
      />
      <StatusBar translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.gameScreenContent} edges={['bottom']}>
        <View style={styles.headerRow}>
          <SecondaryButton
            label="Выйти"
            leadingIconName="arrow-back"
            onPress={handleExitToMenu}
          />
          <View style={styles.statRow}>
            <Text style={styles.gameTitle}>{`Ходы: ${history.length}`}</Text>
          </View>
          <Text style={styles.gameTimer}>{formatTime(seconds)}</Text>
        </View>
        <View style={styles.gameHeader}>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.topRow}>
          {isRightHanded ? foundationSection : stockSection}
          {isRightHanded ? stockSection : foundationSection}
        </View>

        <View style={styles.tableauRow}>
          {state.tableau.map((pile, index) => (
            <View key={`tableau-${index}`} style={styles.tableauPile}>
              {(() => {
                const stackHeight = getStackHeightForPile(pile);
                const dropHeight = stackHeight + CARD_HEIGHT;
                return (
                  <Pile
                    label=""
                    onLayout={(rect) => (tableauLayouts.current[index] = rect)}
                    highlight={hoverTarget?.type === 'tableau' && hoverTarget.index === index}
                    style={{ height: dropHeight, overflow: 'visible', position: 'relative' }}
                  >
                    {pile.length === 0 && <View style={[styles.card, styles.emptySlot]} />}
                    {pile.map((card, cardIndex) => {
                      const isFaceUp = card.faceUp;
                      const hidden =
                        !!dragging?.cards.some((dragCard) => dragCard.id === card.id) ||
                        isCollecting(card.id);
                      return (
                        <Animated.View
                          key={card.id}
                          style={[
                            {
                              position: 'absolute',
                              top: getCardOffsetYForPile(pile, cardIndex),
                              left: 0
                            },
                            hintTransformsRef.current[card.id]
                              ? { transform: hintTransformsRef.current[card.id].getTranslateTransform() }
                              : undefined,
                            hintingCardIds.includes(card.id) ? styles.hintingCard : undefined
                          ]}
                        >
                          {isFaceUp ? (
                            <CardView
                              card={card}
                              onLayout={(rect) => (cardLayouts.current[card.id] = rect)}
                              onStart={(pageX, pageY, rect) =>
                                beginDragIntent(
                                  { type: 'tableau', index, cardIndex },
                                  card.id,
                                  pageX,
                                  pageY,
                                  rect
                                )
                              }
                              onTap={() => {
                                pendingDragRef.current = null;
                                handleTap({ type: 'tableau', index, cardIndex }, card.id);
                              }}
                              disabled={!card.faceUp}
                              hidden={hidden}
                            />
                          ) : (
                            <CardBack disabled={!card.faceUp || hidden} />
                          )}
                        </Animated.View>
                      );
                    })}
                  </Pile>
                );
              })()}
            </View>
          ))}
        </View>

        <View style={styles.bottomStack}>
          {/* Кнопка "Собрать" над основными кнопками */}
          {canAutoFinish && (
            <View style={styles.collectContainer}>
              <SecondaryButton
                label="Собрать"
                onPress={autoFinish}
                style={styles.collectButton}
              />
            </View>
          )}

          <View style={styles.bottomBar}>
            <IconButton
              label="Отменить ход"
              iconName="arrow-undo"
              onPress={undo}
              disabled={history.length === 0}
            />
            <IconButton label="Подсказать" iconName="bulb" onPress={handleHint} disabled={isHinting} />
            <View style={styles.verticalDivider} />
            <IconButton label="Новая игра" iconName="play" onPress={startNewGame} />
            <IconButton
              label="Заново"
              iconName="refresh"
              onPress={resetGame}
              disabled={history.length === 0}
            />
          </View>
          <View style={styles.adBannerContainer}>
            <YandexBanner />
          </View>
        </View>

        {dragging && (
          <Animated.View
            style={[
              styles.dragLayer,
              {
                transform: [{ translateX: dragPosition.x }, { translateY: dragPosition.y }],
                marginLeft: -dragging.offset.x,
                marginTop: -dragging.offset.y
              }
            ]}
            pointerEvents="none"
          >
            {(() => {
              const dragStep = TABLEAU_STACK_STEP;
              return (
                <View
                  style={{
                    height: CARD_HEIGHT + dragStep * (dragging.cards.length - 1),
                    width: CARD_WIDTH
                  }}
                >
                  {dragging.cards.map((card, idx) => (
                    <View
                      key={card.id}
                      style={{
                        position: 'absolute',
                        top: idx * dragStep,
                        left: 0
                      }}
                    >
                      <CardView card={card} floating />
                    </View>
                  ))}
                </View>
              );
            })()}
          </Animated.View>
        )}
        {collectingCards.map((entry) => (
          <Animated.View
            key={entry.card.id}
            style={[
              styles.collectLayer,
              {
                width: entry.width,
                height: entry.height,
                transform: entry.position.getTranslateTransform()
              }
            ]}
            pointerEvents="none"
          >
            <CardView card={entry.card} floating />
          </Animated.View>
        ))}
        {hintMessage ? (
          <View style={styles.hintMessageContainer}>
            <Text style={styles.hintMessageText}>{hintMessage}</Text>
          </View>
        ) : null}

        {/* Победный баннер */}
        <VictoryBanner
          visible={showVictoryBanner}
          moves={history.length}
          time={formatTime(seconds)}
          onNewGame={handleVictoryNewGame}
        />

      </SafeAreaView>
    </View>
  );
};

const expandRect = (rect: Rect, padding: number) => ({
  x: rect.x - padding,
  y: rect.y - padding,
  width: rect.width + padding * 2,
  height: rect.height + padding * 2
});

const findHoverTarget = (
  x: number,
  y: number,
  cards: Card[],
  state: GameState,
  layouts: {
    tableau: Record<number, Rect>;
    foundations: Record<number, Rect>;
  }
) => {
  const foundationPadding = 18;
  if (cards.length === 1) {
    for (let i = 0; i < state.foundations.length; i += 1) {
      const rect = layouts.foundations[i];
      if (!rect) continue;
      const targetRect = expandRect(rect, foundationPadding);
      if (pointInRect(x, y, targetRect)) {
        if (canPlaceOnFoundation(cards[0], state.foundations[i])) {
          return { type: 'foundation', index: i } as const;
        }
      }
    }
  }

  for (let i = 0; i < 7; i += 1) {
    const rect = layouts.tableau[i];
    if (!rect) continue;
    const pile = state.tableau[i];
    const stackHeight = getStackHeightForPile(pile);
    const dropHeight = stackHeight + CARD_HEIGHT;
    const dropRect = {
      x: rect.x - rect.width / 2,
      y: rect.y,
      width: rect.width * 2,
      height: dropHeight
    };
    if (pointInRect(x, y, dropRect) && canPlaceOnTableau(cards, state.tableau[i])) {
      return { type: 'tableau', index: i } as const;
    }
  }

  return null;
};

const pointInRect = (x: number, y: number, rect: Rect) =>
  x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  gameBackground: {
    ...StyleSheet.absoluteFillObject
  },
  gameScreenContent: {
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: PADDING
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16
  },
  statRow: {
    flex: 1,
    alignItems: 'center'
  },
  bottomStack: {
    position: 'absolute',
    left: PADDING,
    right: PADDING,
    bottom: 10
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  adBannerContainer: {
    width: '100%',
    height: 90,
    marginTop: 4
  },
  verticalDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 6
  },
  collectContainer: {
    marginBottom: 12,
    alignItems: 'center'
  },
  collectButton: {
    marginLeft: 8
  },
  headerSpacer: {
    flex: 1
  },
  gameTitle: {
    color: '#f7f3e8',
    fontSize: 18,
    fontWeight: '700'
  },
  gameTimer: {
    color: '#f4d35e',
    fontSize: 18,
    fontWeight: '700'
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  stockRow: {
    flexDirection: 'row',
    gap: GAP
  },
  foundationRow: {
    flexDirection: 'row',
    gap: GAP
  },
  tableauRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  tableauPile: {
    width: CARD_WIDTH
  },
  wasteStack: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    position: 'relative'
  },
  wasteCard: {
    position: 'absolute',
    top: 0,
    left: 0
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
    backgroundColor: '#f7f3e8',
    borderWidth: 1,
    borderColor: '#d6cdb8',
    padding: 6,
    justifyContent: 'space-between'
  },
  emptySlot: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.2)'
  },
  emptyText: {
    color: '#f7f3e8',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 26
  },
  dragLayer: {
    position: 'absolute',
    zIndex: 20
  },
  collectLayer: {
    position: 'absolute',
    zIndex: 25
  },
  hintingCard: {
    zIndex: 999,
    elevation: 10
  },
  hintMessageContainer: {
    position: 'absolute',
    top: 140,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(20,20,20,0.8)'
  },
  hintMessageText: {
    color: '#f7f3e8',
    fontWeight: '700'
  },
  foundationSlot: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  foundationPlaceholderVisible: {
    opacity: 1,
    position: 'absolute',
    top: 0,
    left: 0
  },
  foundationPlaceholderHidden: {
    opacity: 0,
    position: 'absolute',
    top: 0,
    left: 0
  },
  foundationPlaceholderLetter: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    transform: [{ translateY: -18 }],
    fontSize: 32,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.15)'
  }
});
