export const gameThemes = {
  impostor: {
    accent:      '#FF2D78',
    accentDark:  '#1a0010',
    accentLight: '#FF6FA3',
    accentMuted: '#4a0020',
    text:        '#FFFFFF',
    textMuted:   '#FFB3CC',
  },
  wavelength: {
    accent:      '#4FC3F7',
    accentDark:  '#001a2a',
    accentLight: '#87D8FA',
    accentMuted: '#003a55',
    text:        '#FFFFFF',
    textMuted:   '#A8DCEF',
  },
  taboo: {
    accent:      '#69F0AE',
    accentDark:  '#001a0e',
    accentLight: '#9EFFC8',
    accentMuted: '#003320',
    text:        '#111111',
    textMuted:   '#1a4a30',
  },
} as const;

export type GameThemeId = keyof typeof gameThemes;
export type GameThemeColors = typeof gameThemes[GameThemeId];
