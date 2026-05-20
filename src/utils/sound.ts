import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

const PLACE_SOUND = require('../../assets/sounds/card_place.wav');
const RECYCLE_SOUND = require('../../assets/sounds/card_recycle.wav');
const DEAL_SOUND = require('../../assets/sounds/card_deal.wav');
const FLIP_SOUND = require('../../assets/sounds/card_flip.wav');

let isConfigured = false;
let placeSound: AudioPlayer | null = null;
let recycleSound: AudioPlayer | null = null;
let dealSound: AudioPlayer | null = null;
let flipSound: AudioPlayer | null = null;

const ensureAudioMode = async () => {
  if (isConfigured) return;
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionModeAndroid: 'duckOthers'
  });
  isConfigured = true;
};

const ensureSound = async (type: 'place' | 'recycle' | 'deal' | 'flip') => {
  await ensureAudioMode();
  const current =
    type === 'place'
      ? placeSound
      : type === 'recycle'
        ? recycleSound
        : type === 'deal'
          ? dealSound
          : flipSound;
  if (current) return current;

  const sound = createAudioPlayer(
    type === 'place'
      ? PLACE_SOUND
      : type === 'recycle'
        ? RECYCLE_SOUND
        : type === 'deal'
          ? DEAL_SOUND
          : FLIP_SOUND
  );
  sound.volume = 0.55;
  sound.loop = false;

  if (type === 'place') {
    placeSound = sound;
    return placeSound;
  }

  recycleSound = sound;
  if (type === 'recycle') {
    return recycleSound;
  }
  if (type === 'deal') {
    dealSound = sound;
    return dealSound;
  }

  flipSound = sound;
  return flipSound;
};

const play = async (type: 'place' | 'recycle' | 'deal' | 'flip') => {
  try {
    const sound = await ensureSound(type);
    await sound.seekTo(0);
    sound.play();
  } catch (error) {
    console.warn('Sound playback failed', error);
  }
};

export const playCardPlaceSound = () => {
  void play('place');
};

export const playCardRecycleSound = () => {
  void play('recycle');
};

export const playCardDealSound = () => {
  void play('deal');
};

export const stopCardDealSound = () => {
  if (!dealSound) return;
  try {
    dealSound.pause();
    void dealSound.seekTo(0);
  } catch (error) {
    console.warn('Deal sound stop failed', error);
  }
};

export const playCardFlipSound = () => {
  void play('flip');
};

export const playHintMagicSound = () => {
  // Layer two short sounds for a "magic hint" feel without adding new assets.
  void play('flip');
  setTimeout(() => {
    void play('place');
  }, 90);
};
