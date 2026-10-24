export const FONT_OPTIONS = {
  english: [
    'Manrope', 'Inter', 'Montserrat', 'Poppins', 'Roboto', 'Nunito Sans',
    'DM Sans', 'Lato', 'Work Sans', 'Playfair Display', 'Merriweather', 'Source Sans 3',
    'Open Sans', 'Roboto Slab', 'Oswald', 'Raleway', 'Ubuntu', 'Outfit',
    'Space Grotesk', 'Fira Sans', 'IBM Plex Sans', 'Plus Jakarta Sans', 'Archivo',
    'Libre Baskerville', 'Barlow', 'Mulish', 'Urbanist', 'Sora', 'Rubik', 'Exo 2',
  ],
  arabic: [
    'IBM Plex Sans Arabic', 'Cairo', 'Tajawal', 'Noto Sans Arabic', 'Almarai',
    'Readex Pro', 'Rubik', 'Alexandria', 'Noto Kufi Arabic', 'Changa', 'Amiri',
    'Noto Naskh Arabic', 'Aref Ruqaa', 'Lemonada', 'El Messiri', 'Lateef', 'Mada',
    'Markazi Text', 'Mirza', 'Reem Kufi', 'Scheherazade New', 'Vazirmatn',
    'Harmattan', 'Baloo Bhaijaan 2', 'Gulzar', 'Kufam', 'Rakkas', 'Lalezar',
    'Noto Serif Arabic', 'Jomhuria', 'Katibeh',
  ],
};

export const DEFAULT_SITE_FONTS = {
  english: 'Manrope',
  arabic: 'IBM Plex Sans Arabic',
  letterSpacing: 0.01,
};

// The font picker is opened only in the appearance settings. Loading a regular
// preview face there lets every choice show its real shape without downloading
// the full catalog for normal visitors.
export function loadFontPreviews() {
  if (typeof document === 'undefined') return;
  const families = [...new Set([...FONT_OPTIONS.english, ...FONT_OPTIONS.arabic])];
  const query = new URLSearchParams();
  families.forEach((family) => query.append('family', family));
  query.set('display', 'swap');
  const href = `https://fonts.googleapis.com/css2?${query.toString()}`;
  let stylesheet = document.getElementById('cliplens-font-previews');
  if (!stylesheet) {
    stylesheet = document.createElement('link');
    stylesheet.id = 'cliplens-font-previews';
    stylesheet.rel = 'stylesheet';
    document.head.appendChild(stylesheet);
  }
  if (stylesheet.getAttribute('href') !== href) stylesheet.setAttribute('href', href);
}

export function applySiteFonts(preferences = {}) {
  if (typeof document === 'undefined') return;
  const english = FONT_OPTIONS.english.includes(preferences.english)
    ? preferences.english
    : DEFAULT_SITE_FONTS.english;
  const arabic = FONT_OPTIONS.arabic.includes(preferences.arabic)
    ? preferences.arabic
    : DEFAULT_SITE_FONTS.arabic;
  const requestedSpacing = Number(preferences.letterSpacing);
  const letterSpacing = Number.isFinite(requestedSpacing)
    ? Math.min(0.04, Math.max(0, requestedSpacing))
    : DEFAULT_SITE_FONTS.letterSpacing;
  const root = document.documentElement;
  root.style.setProperty('--font-english', `"${english}", ui-sans-serif, system-ui, sans-serif`);
  root.style.setProperty('--font-arabic', `"${arabic}", "${english}", ui-sans-serif, system-ui, sans-serif`);
  root.style.setProperty('--site-letter-spacing', `${letterSpacing}em`);

  const query = new URLSearchParams();
  [english, arabic].forEach((family) => {
    query.append('family', family);
  });
  query.set('display', 'swap');
  const href = `https://fonts.googleapis.com/css2?${query.toString()}`;
  let stylesheet = document.getElementById('cliplens-site-fonts');
  if (!stylesheet) {
    const link = document.createElement('link');
    link.id = 'cliplens-site-fonts';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    stylesheet = link;
  }
  if (stylesheet.getAttribute('href') !== href) stylesheet.setAttribute('href', href);
}
