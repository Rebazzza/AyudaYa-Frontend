/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF7717',
          hover: '#e0630d',
        },
        primary: {
          DEFAULT: '#9d4400',
          container: '#ff7717',
          fixed: '#ffdbca',
          'fixed-dim': '#ffb690',
        },
        'on-primary': {
          DEFAULT: '#ffffff',
          container: '#5d2500',
          fixed: '#331100',
          'fixed-variant': '#783200',
        },
        secondary: {
          DEFAULT: '#9f4200',
          container: '#ff7520',
        },
        'on-secondary': {
          DEFAULT: '#ffffff',
          container: '#5d2300',
        },
        tertiary: {
          DEFAULT: '#006493',
          container: '#00a8f2',
        },
        'on-tertiary': {
          DEFAULT: '#ffffff',
        },
        surface: {
          DEFAULT: '#f8f9fa',
          dim: '#d9dadb',
          bright: '#f8f9fa',
          container: {
            DEFAULT: '#edeeef',
            lowest: '#ffffff',
            low: '#f3f4f5',
            high: '#e7e8e9',
            highest: '#e1e3e4',
          },
          variant: '#e1e3e4',
        },
        'on-surface': {
          DEFAULT: '#191c1d',
          variant: '#584236',
        },
        background: '#f8f9fa',
        'on-background': '#191c1d',
        outline: {
          DEFAULT: '#8c7164',
          variant: '#e0c0b1',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        'on-error': {
          DEFAULT: '#ffffff',
          container: '#93000a',
        },
        inverse: {
          surface: '#2e3132',
          primary: '#ffb690',
          'on-surface': '#f0f1f2',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
