/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        main: ['Lato'],
      },
      variants: {
        extend: {
          backgroundImage: ['hover'],
        },
      },
      colors: {
        custom_orange: '#ec722b',
        currentColor: '#ec722b',
        custom_btnorange: 'rgba(236, 114, 43, 0.8)',
        custom_transparent: 'rgba(106, 108, 122, 0.5)',
        custom_gray: 'rgba(176, 188, 206, 0.8)',
        custom_gray_pk: '#4c4d56',
        custom_header: 'rgba(106, 108, 122, 0.5)',
        custom_black: 'rgba(0,0,0,0.6)',
        custom_white: 'rgba(255, 255, 255, 0.9)',
        btn_hover: 'rgba(236, 114, 43, 0.5)',
      },
      backgroundImage: {
        'custom-gradient': 'linear-gradient(90deg, #ec722b 0%, #4c4d56 100%)',
        'gradient-to-r-hover':
          'linear-gradient(90deg, #f15b22 0%, #3a3b42 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      margin: {
        7.5: '30px',
        '-11.25': '-45px',
      },
      spacing: {
        2.5: '10px',
      },
      lineHeight: {
        mobile: '1.3',
        150: '1.5',
      },
      width: {
        // '50%-gap': 'calc(50% - 15px)',
        '50%-gap': 'calc(50% - 30px)',
        '30%-gap': 'calc(32% - 5px)',
      },
      screens: {
        xs: '480px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1240px',
        '2xl': '1536px',
      },
      keyframes: {
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'gradient-loader': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '200% 50%' },
          '100%': { backgroundPosition: '50% 50%' },
        },
      },
      animation: {
        spinner: 'spin 60s linear infinite',
        gradient: 'gradient-loader 5s ease infinite',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.no-scrollbar::-webkit-scrollbar': {
          width: '0px',
          height: '0px',
          display: 'none',
        },
        '.no-scrollbar': {
          '-ms-overflow-style': 'none' /* Internet Explorer 10+ */,
          'scrollbar-width': 'none' /* Firefox */,
          'scrollbar-color': 'transparent',
        },
        '.overflow-x-hidden': {
          overflowX: 'hidden',
        },
        '.webkit-overflow-scrolling-touch': {
          '-webkit-overflow-scrolling': 'touch',
        },
        '.resize-none': {
          resize: 'none',
        },
        '.bg-gradient-to-r-hover': {
          backgroundImage: 'linear-gradient(90deg, #f15b22 0%, #3a3b42 100%)',
        },
      });
    },
  ],
  tailwindcss: {},
  autoprefixer: {},
};

export default config;
