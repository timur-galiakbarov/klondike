import { t } from '../i18n';

export const CARD_BACK_THEMES = [
  { id: 'classic', label: t('classicTheme') },
  { id: 'pexels_bengi', label: 'Pexels Bengi' },
  { id: 'pexels_nui', label: 'Pexels Nui' },
  { id: 'pexels_anniroenkae_4175070', label: 'Pexels Anniroenkae 4175070' },
  { id: 'pexels_eberhardgross_2088205', label: 'Pexels Eberhardgross 2088205' },
  { id: 'pexels_anniroenkae_2832432', label: 'Pexels Anniroenkae 2832432' },
  { id: 'pexels_enginakyurt_1820511', label: 'Pexels Enginakyurt 1820511' },
  { id: 'pexels_sebastian_palomino_1955134', label: 'Pexels Sebastian 1955134' },
  { id: 'pexels_anete_lusina_6331082', label: 'Pexels Anete 6331082' },
  { id: 'pexels_eberhardgross_1366919', label: 'Pexels Eberhardgross 1366919' }
] as const;

export type CardBackTheme = (typeof CARD_BACK_THEMES)[number]['id'];

export const DEFAULT_CARD_BACK_THEME: CardBackTheme = 'classic';

const themeIds = new Set<CardBackTheme>(CARD_BACK_THEMES.map((item) => item.id));

export const isCardBackTheme = (value: unknown): value is CardBackTheme =>
  typeof value === 'string' && themeIds.has(value as CardBackTheme);
