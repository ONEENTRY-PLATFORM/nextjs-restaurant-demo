/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  content: ['*.html'],
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
      plugins: [],
      screens: {
        mobile_wide: '500px',
        md_wide: { min: '1020px', max: '1279px' },
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
        '50%-gap': 'calc(50% - 15px)',
        '50%-gap': 'calc(50% - 30px)',
        '30%-gap': 'calc(32% - 5px)',
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
