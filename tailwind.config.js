/**
 * Tailwind v4 picks up design tokens, colors, fonts, screens, gradients and
 * custom spacing from `app/globals.css` (`@theme inline { ... }`). This file
 * only keeps what cannot (yet) be expressed there:
 *   - `content` paths (legacy, picked up by @tailwindcss/postcss)
 *   - the `.no-scrollbar` utility plugin (used in scrolling lists/sliders)
 */

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.no-scrollbar::-webkit-scrollbar': {
          width: '0px',
          height: '0px',
          display: 'none',
        },
        '.no-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          'scrollbar-color': 'transparent',
        },
      });
    },
  ],
};

export default config;
