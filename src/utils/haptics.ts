import * as Haptics from 'expo-haptics';

export const triggerHaptic = () => {
  Haptics.selectionAsync().catch(() => undefined);
};
