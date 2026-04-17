const accentPalette = {
  sunset: { primary: '#ff6b3d', secondary: '#ff9f1c', glow: 'rgba(255, 107, 61, 0.18)' },
  ocean: { primary: '#1f7fff', secondary: '#00b4d8', glow: 'rgba(31, 127, 255, 0.2)' },
  mint: { primary: '#14b884', secondary: '#9ad84b', glow: 'rgba(20, 184, 132, 0.2)' },
};

export function applyStoredAppearance() {
  if (typeof window === 'undefined') {
    return { editorTheme: 'light' };
  }

  const root = document.documentElement;
  const body = document.body;
  let settings = {};

  try {
    settings = JSON.parse(localStorage.getItem('lla-settings') || '{}');
  } catch {
    settings = {};
  }

  const palette = accentPalette[settings.accent] || accentPalette.sunset;
  root.style.setProperty('--accent-primary', palette.primary);
  root.style.setProperty('--accent-secondary', palette.secondary);
  root.style.setProperty('--accent-glow', palette.glow);

  const isNightTheme = settings.theme === 'night';
  body.classList.toggle('theme-night', isNightTheme);
  body.classList.toggle('motion-off', settings.motion === false);

  return {
    editorTheme: isNightTheme ? 'vs-dark' : 'light',
  };
}
