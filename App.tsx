import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

type Card = {
  id: string;
  suit: Suit;
  rank: number; // 1..13
  faceUp: boolean;
};

type PileType = 'tableau' | 'foundation' | 'waste' | 'stock';

type DragSource =
  | { type: 'tableau'; index: number; cardIndex: number }
  | { type: 'foundation'; index: number }
  | { type: 'waste' };

type DragState = {
  source: DragSource;
  cards: Card[];
  offset: { x: number; y: number };
};

type GameState = {
  stock: Card[];
  waste: Card[];
  tableau: Card[][];
  foundations: Record<Suit, Card[]>;
};

type Rect = { x: number; y: number; width: number; height: number };

type Stats = {
  totalGames: number;
  completedGames: number;
  bestTimes: number[];
};

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const STATS_KEY = 'klondike_stats_v1';

const CARD_RATIO = 1.4; // height = width * ratio
const GAP = 8;
const PADDING = 12;
const CARD_WIDTH = Math.min(72, (SCREEN_WIDTH - PADDING * 2 - GAP * 6) / 7);
const CARD_HEIGHT = CARD_WIDTH * CARD_RATIO;
const TABLEAU_OFFSET = 18;
const TABLEAU_STACK_STEP = 28;

const rankLabel = (rank: number) => {
  if (rank === 1) return 'A';
  if (rank === 11) return 'J';
  if (rank === 12) return 'Q';
  if (rank === 13) return 'K';
  return String(rank);
};

const suitSymbol = (suit: Suit) => {
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

const isRed = (suit: Suit) => suit === 'hearts' || suit === 'diamonds';

const cloneState = (state: GameState): GameState => JSON.parse(JSON.stringify(state));

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

const dealGame = (): GameState => {
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
    tableau,
    foundations: {
      hearts: [],
      diamonds: [],
      clubs: [],
      spades: []
    }
  };
};

const canPlaceOnTableau = (cards: Card[], destination: Card[]): boolean => {
  const movingCard = cards[0];
  if (!movingCard) return false;
  if (destination.length === 0) return movingCard.rank === 13;
  const top = destination[destination.length - 1];
  if (!top.faceUp) return false;
  const colorDiff = isRed(movingCard.suit) !== isRed(top.suit);
  return colorDiff && movingCard.rank === top.rank - 1;
};

const canPlaceOnFoundation = (card: Card, destination: Card[]): boolean => {
  if (!card) return false;
  if (destination.length === 0) return card.rank === 1;
  const top = destination[destination.length - 1];
  return card.suit === top.suit && card.rank === top.rank + 1;
};

const isGameComplete = (state: GameState) =>
  SUITS.every((suit) => state.foundations[suit].length === 13);

const triggerHaptic = () => {
  Haptics.selectionAsync().catch(() => undefined);
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const useStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalGames: 0,
    completedGames: 0,
    bestTimes: []
  });

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STATS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Stats>;
          setStats({
            totalGames: parsed.totalGames ?? 0,
            completedGames: parsed.completedGames ?? 0,
            bestTimes: parsed.bestTimes ?? []
          });
        }
      } catch (err) {
        // ignore read errors
      }
    };
    load();
  }, []);

  const save = useCallback((next: Stats) => {
    setStats(next);
    AsyncStorage.setItem(STATS_KEY, JSON.stringify(next)).catch(() => undefined);
  }, []);

  return { stats, save };
};

const App = () => {
  const [screen, setScreen] = useState<'home' | 'game' | 'stats'>('home');
  const { stats, save } = useStats();
  const [gameKey, setGameKey] = useState(0);

  const handleNewGame = () => {
    save({ ...stats, totalGames: stats.totalGames + 1 });
    setGameKey((prev) => prev + 1);
    setScreen('game');
  };

  const handleGameComplete = (seconds: number) => {
    const bestTimes = [...stats.bestTimes, seconds].sort((a, b) => a - b).slice(0, 3);
    save({
      ...stats,
      completedGames: stats.completedGames + 1,
      bestTimes
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      {screen === 'home' && (
        <HomeScreen onStart={handleNewGame} onStats={() => setScreen('stats')} />
      )}
      {screen === 'game' && (
        <GameScreen
          key={gameKey}
          onBack={() => setScreen('home')}
          onComplete={handleGameComplete}
        />
      )}
      {screen === 'stats' && (
        <StatsScreen stats={stats} onBack={() => setScreen('home')} />
      )}
    </SafeAreaView>
  );
};

const HomeScreen = ({ onStart, onStats }: { onStart: () => void; onStats: () => void }) => {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Пасьянс косынка</Text>
      <View style={styles.menu}>
        <PrimaryButton label="Начать игру" onPress={onStart} />
        <SecondaryButton label="Мои результаты" onPress={onStats} />
      </View>
    </View>
  );
};

const StatsScreen = ({ stats, onBack }: { stats: Stats; onBack: () => void }) => {
  const times = stats.bestTimes.slice(0, 3);
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Мои результаты</Text>
      <View style={styles.cardPanel}>
        <Text style={styles.statLabel}>Всего пасьянсов</Text>
        <Text style={styles.statValue}>{stats.totalGames}</Text>
      </View>
      <View style={styles.cardPanel}>
        <Text style={styles.statLabel}>Завершено игр</Text>
        <Text style={styles.statValue}>{stats.completedGames}</Text>
      </View>
      <View style={styles.cardPanel}>
        <Text style={styles.statLabel}>Лучшие времена</Text>
        {times.length === 0 ? (
          <Text style={styles.statValue}>—</Text>
        ) : (
          times.map((value, idx) => (
            <Text key={`time-${idx}`} style={styles.statValue}>
              {formatTime(value)}
            </Text>
          ))
        )}
      </View>
      <SecondaryButton label="Назад" onPress={onBack} />
    </View>
  );
};

const GameScreen = ({
  onBack,
  onComplete
}: {
  onBack: () => void;
  onComplete: (seconds: number) => void;
}) => {
  const [state, setState] = useState<GameState>(() => dealGame());
  const [history, setHistory] = useState<GameState[]>([]);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [completed, setCompleted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [hoverTarget, setHoverTarget] = useState<
    | { type: 'tableau'; index: number }
    | { type: 'foundation'; suit: Suit }
    | null
  >(null);

  const cardLayouts = useRef<Record<string, Rect>>({});
  const tableauLayouts = useRef<Record<number, Rect>>({});
  const foundationLayouts = useRef<Record<Suit, Rect>>({} as Record<Suit, Rect>);
  const draggingRef = useRef(false);
  const didDragRef = useRef(false);
  const gameLayoutRef = useRef<Rect | null>(null);
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);
  const pendingDragRef = useRef<{
    source: DragSource;
    cardId: string;
    startX: number;
    startY: number;
    rect?: Rect;
  } | null>(null);
  const hoverTargetRef = useRef<
    | { type: 'tableau'; index: number }
    | { type: 'foundation'; suit: Suit }
    | null
  >(null);
  const dragPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  useEffect(() => {
    if (!completed && isGameComplete(state)) {
      setCompleted(true);
      onComplete(seconds);
    }
  }, [state, completed, onComplete, seconds]);

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
      pushHistory(next);
      return;
    }
    const card = next.stock.pop();
    if (card) {
      card.faceUp = true;
      next.waste.push(card);
      pushHistory(next);
    }
  };

  const undo = () => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setState(last);
      return prev.slice(0, -1);
    });
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
      const card = state.waste[state.waste.length - 1];
      if (card) cards = [card];
    } else if (source.type === 'foundation') {
      const suit = SUITS[source.index];
      const pile = state.foundations[suit];
      const card = pile[pile.length - 1];
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
          if (card) dest.push(card);
        } else if (dragging.source.type === 'foundation') {
          const suit = SUITS[dragging.source.index];
          const card = next.foundations[suit].pop();
          if (card) dest.push(card);
        }
        moved = true;
      }
    }

    if (target?.type === 'foundation' && dragging.cards.length === 1) {
      if (dragging.source.type === 'foundation') {
        const fromSuit = SUITS[dragging.source.index];
        if (fromSuit === target.suit) {
          setDragging(null);
          setHoverTarget(null);
          return;
        }
      }
      const dest = next.foundations[target.suit];
      if (canPlaceOnFoundation(dragging.cards[0], dest)) {
        if (dragging.source.type === 'tableau') {
          const fromPile = next.tableau[dragging.source.index];
          const card = fromPile.pop();
          if (card) dest.push(card);
          if (fromPile.length > 0) fromPile[fromPile.length - 1].faceUp = true;
        } else if (dragging.source.type === 'waste') {
          const card = next.waste.pop();
          if (card) dest.push(card);
        } else if (dragging.source.type === 'foundation') {
          const fromSuit = SUITS[dragging.source.index];
          if (fromSuit !== target.suit) {
            const card = next.foundations[fromSuit].pop();
            if (card) dest.push(card);
          }
        }
        moved = true;
      }
    }

    if (moved) {
      pushHistory(next);
      triggerHaptic();
    }

    draggingRef.current = false;
    pendingDragRef.current = null;
    hoverTargetRef.current = null;
    setDragging(null);
    setHoverTarget(null);
    const gameRect = gameLayoutRef.current;
    const localX = gameRect ? pageX - gameRect.x : pageX;
    const localY = gameRect ? pageY - gameRect.y : pageY;
    dragPosition.setValue({ x: localX, y: localY });
    setTimeout(() => {
      didDragRef.current = false;
    }, 0);
  };

  const tryAutoToFoundation = (source: DragSource) => {
    if (source.type === 'foundation') return;
    if (source.type === 'tableau') {
      const fromPile = state.tableau[source.index];
      if (source.cardIndex !== fromPile.length - 1) return;
      const card = fromPile[fromPile.length - 1];
      if (!card?.faceUp) return;
      const dest = state.foundations[card.suit];
      if (!canPlaceOnFoundation(card, dest)) return;

      const next = cloneState(state);
      const moving = next.tableau[source.index].pop();
      if (moving) {
        next.foundations[moving.suit].push(moving);
        if (next.tableau[source.index].length > 0) {
          next.tableau[source.index][next.tableau[source.index].length - 1].faceUp = true;
        }
        pushHistory(next);
        triggerHaptic();
      }
      return;
    }
    if (source.type === 'waste') {
      const card = state.waste[state.waste.length - 1];
      if (!card) return;
      const dest = state.foundations[card.suit];
      if (!canPlaceOnFoundation(card, dest)) return;
      const next = cloneState(state);
      const moving = next.waste.pop();
      if (moving) {
        next.foundations[moving.suit].push(moving);
        pushHistory(next);
        triggerHaptic();
      }
    }
  };

  const handleTap = (source: DragSource, cardId: string) => {
    if (didDragRef.current) return;
    const now = Date.now();
    const last = lastTapRef.current;
    if (last && last.id === cardId && now - last.time < 300) {
      lastTapRef.current = null;
      tryAutoToFoundation(source);
      return;
    }
    lastTapRef.current = { id: cardId, time: now };
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponderCapture: () =>
          draggingRef.current || !!pendingDragRef.current,
        onMoveShouldSetPanResponderCapture: () =>
          draggingRef.current || !!pendingDragRef.current,
        onMoveShouldSetPanResponder: () =>
          draggingRef.current || !!pendingDragRef.current,
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
      style={styles.gameScreen}
      onLayout={(event) => {
        event.currentTarget.measureInWindow((x, y, width, height) => {
          gameLayoutRef.current = { x, y, width, height };
        });
      }}
      {...panResponder.panHandlers}
    >
      <View style={styles.gameTopBar}>
        <Text style={styles.gameTitle}>Пасьянс</Text>
        <Text style={styles.gameTimer}>{formatTime(seconds)}</Text>
      </View>
      <View style={styles.gameHeader}>
        <SecondaryButton label="Назад" onPress={onBack} />
        <View style={styles.headerSpacer} />
        <SecondaryButton label="Отмена" onPress={undo} disabled={history.length === 0} />
      </View>

      <View style={styles.topRow}>
        <View style={styles.stockRow}>
          <Pile
            label="Колода"
            highlight={false}
          >
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

          <Pile label="Сброс" highlight={false}>
            {state.waste.length === 0 ? (
              <View style={[styles.card, styles.emptySlot]} />
            ) : (
        <CardView
          card={state.waste[state.waste.length - 1]}
          onLayout={(rect) =>
            (cardLayouts.current[state.waste[state.waste.length - 1].id] = rect)
          }
                onStart={(pageX, pageY, rect) =>
                  beginDragIntent(
                    { type: 'waste' },
                    state.waste[state.waste.length - 1].id,
                    pageX,
                    pageY,
                    rect
                  )
                }
                onTap={() => {
                  pendingDragRef.current = null;
                  handleTap({ type: 'waste' }, state.waste[state.waste.length - 1].id);
                }}
                hidden={dragging?.cards.some((card) => card.id === state.waste[state.waste.length - 1].id)}
              />
            )}
          </Pile>
        </View>

        <View style={styles.foundationRow}>
          {SUITS.map((suit, index) => (
            <Pile
              key={suit}
              label={suitSymbol(suit)}
              onLayout={(rect) => (foundationLayouts.current[suit] = rect)}
              highlight={hoverTarget?.type === 'foundation' && hoverTarget.suit === suit}
            >
              {state.foundations[suit].length === 0 ? (
                <View style={[styles.card, styles.emptySlot]} />
              ) : (
                <CardView
                  card={state.foundations[suit][state.foundations[suit].length - 1]}
                  onLayout={(rect) =>
                    (cardLayouts.current[
                      state.foundations[suit][state.foundations[suit].length - 1].id
                    ] = rect)
                  }
                  onStart={(pageX, pageY, rect) =>
                    beginDragIntent(
                      { type: 'foundation', index },
                      state.foundations[suit][state.foundations[suit].length - 1].id,
                      pageX,
                      pageY,
                      rect
                    )
                  }
                  onTap={() => {
                    pendingDragRef.current = null;
                    handleTap(
                      { type: 'foundation', index },
                      state.foundations[suit][state.foundations[suit].length - 1].id
                    );
                  }}
                  hidden={dragging?.cards.some(
                    (card) => card.id === state.foundations[suit][state.foundations[suit].length - 1].id
                  )}
                />
              )}
            </Pile>
          ))}
        </View>
      </View>

      <View style={styles.tableauRow}>
        {state.tableau.map((pile, index) => (
          <View key={`tableau-${index}`} style={styles.tableauPile}>
            {(() => {
              const stackHeight =
                pile.length > 0
                  ? CARD_HEIGHT + (pile.length - 1) * TABLEAU_STACK_STEP
                  : CARD_HEIGHT;
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
                const hidden = !!dragging?.cards.some((dragCard) => dragCard.id === card.id);
                return (
                  <View
                    key={card.id}
                    style={{
                      position: 'absolute',
                      top: cardIndex * TABLEAU_STACK_STEP,
                      left: 0
                    }}
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
                  </View>
                );
              })}
                  </Pile>
              );
            })()}
          </View>
        ))}
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
    </View>
  );
};

const findHoverTarget = (
  x: number,
  y: number,
  cards: Card[],
  state: GameState,
  layouts: {
    tableau: Record<number, Rect>;
    foundations: Record<Suit, Rect>;
  }
) => {
  for (const suit of SUITS) {
    const rect = layouts.foundations[suit];
    if (!rect) continue;
    if (pointInRect(x, y, rect) && cards.length === 1) {
      if (canPlaceOnFoundation(cards[0], state.foundations[suit])) {
        return { type: 'foundation', suit } as const;
      }
    }
  }

  for (let i = 0; i < 7; i += 1) {
    const rect = layouts.tableau[i];
    if (!rect) continue;
    const pile = state.tableau[i];
    const stackHeight =
      pile.length > 0 ? CARD_HEIGHT + (pile.length - 1) * TABLEAU_STACK_STEP : CARD_HEIGHT;
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

const PrimaryButton = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.primaryButton} onPress={onPress} activeOpacity={0.85}>
    <Text style={styles.primaryLabel}>{label}</Text>
  </TouchableOpacity>
);

const SecondaryButton = ({
  label,
  onPress,
  disabled
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) => (
  <TouchableOpacity
    style={[styles.secondaryButton, disabled && styles.secondaryButtonDisabled]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
  >
    <Text style={styles.secondaryLabel}>{label}</Text>
  </TouchableOpacity>
);

const Pile = ({
  label,
  highlight,
  onLayout,
  children,
  style
}: {
  label: string;
  highlight: boolean;
  onLayout?: (rect: Rect) => void;
  children: React.ReactNode;
  style?: object;
}) => {
  const ref = useRef<View>(null);
  return (
    <View
      ref={ref}
      style={[styles.pile, highlight && styles.pileHighlight, style]}
      onLayout={(event) => {
        if (!onLayout) return;
        ref.current?.measureInWindow((x, y, width, height) => {
          onLayout({ x, y, width, height });
        });
      }}
    >
      {children}
      {label ? <Text style={styles.pileLabel}>{label}</Text> : null}
    </View>
  );
};

const CardView = ({
  card,
  onLayout,
  onStart,
  onTap,
  floating,
  disabled,
  hidden
}: {
  card: Card;
  onLayout?: (rect: Rect) => void;
  onStart?: (pageX: number, pageY: number, rect: Rect) => void;
  onTap?: () => void;
  floating?: boolean;
  disabled?: boolean;
  hidden?: boolean;
}) => {
  const ref = useRef<View>(null);
  return (
    <View
      ref={ref}
      style={[styles.card, floating && styles.cardFloating, hidden && styles.cardHidden]}
      onLayout={(event) => {
        if (!onLayout) return;
        ref.current?.measureInWindow((x, y, width, height) => {
          onLayout({ x, y, width, height });
        });
      }}
      onStartShouldSetResponder={() => !disabled && !hidden}
      onResponderGrant={(event) => {
        if (!onStart) return;
        ref.current?.measureInWindow((x, y, width, height) => {
          onStart(event.nativeEvent.pageX, event.nativeEvent.pageY, {
            x,
            y,
            width,
            height
          });
        });
      }}
      onResponderRelease={() => {
        if (disabled || hidden) return;
        if (onTap) onTap();
      }}
    >
      <Text style={[styles.cardCornerSuit, isRed(card.suit) && styles.cardRankRed]}>
        {suitSymbol(card.suit)}
      </Text>
      <Text style={[styles.cardRank, isRed(card.suit) && styles.cardRankRed]}>
        {rankLabel(card.rank)}
      </Text>
      <Text style={[styles.cardSuit, isRed(card.suit) && styles.cardRankRed]}>
        {suitSymbol(card.suit)}
      </Text>
    </View>
  );
};

const CardBack = ({ disabled }: { disabled?: boolean }) => (
  <View style={[styles.card, styles.cardBack, disabled && styles.cardBackDim]}>
    <View style={styles.cardBackInner}>
      <View style={styles.cardBackStripe} />
      <View style={styles.cardBackStripe} />
      <View style={styles.cardBackStripe} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0f2a1f'
  },
  screen: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    color: '#f7f3e8',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 28
  },
  menu: {
    width: '100%',
    gap: 16
  },
  primaryButton: {
    backgroundColor: '#f4d35e',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center'
  },
  primaryLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e1a14'
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    alignItems: 'center'
  },
  secondaryButtonDisabled: {
    opacity: 0.5
  },
  secondaryLabel: {
    color: '#f7f3e8',
    fontSize: 16,
    fontWeight: '600'
  },
  cardPanel: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    borderRadius: 18,
    marginBottom: 18,
    width: '100%'
  },
  statLabel: {
    color: '#b7b1a7',
    fontSize: 14,
    marginBottom: 6
  },
  statValue: {
    color: '#f7f3e8',
    fontSize: 22,
    fontWeight: '700'
  },
  gameScreen: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: PADDING
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  gameTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
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
  headerSpacer: {
    flex: 1
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
    width: CARD_WIDTH,
    position: 'relative',
    overflow: 'visible'
  },
  pile: {
    width: CARD_WIDTH,
    minHeight: CARD_HEIGHT + 6,
    alignItems: 'center'
  },
  pileLabel: {
    color: '#7c8b7f',
    fontSize: 12,
    marginTop: 4
  },
  pileHighlight: {
    backgroundColor: 'rgba(244,211,94,0.2)',
    borderRadius: 12
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
  cardFloating: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6
  },
  cardHidden: {
    opacity: 0
  },
  cardRank: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1b14',
    marginTop: -4
  },
  cardCornerSuit: {
    position: 'absolute',
    top: 6,
    right: 4,
    fontSize: 10,
    fontWeight: '700',
    color: '#1f1b14'
  },
  cardSuit: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'right',
    color: '#1f1b14'
  },
  cardRankRed: {
    color: '#c2352f'
  },
  cardBack: {
    backgroundColor: '#2c4a7d',
    borderColor: '#e3e0d4',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardBackInner: {
    width: '86%',
    height: '86%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'space-evenly',
    paddingVertical: 6
  },
  cardBackStripe: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: 8,
    borderRadius: 3
  },
  cardBackDim: {
    opacity: 0.7
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
  }
});

export default App;
