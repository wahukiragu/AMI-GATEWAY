import type { Config } from 'tailwindcss';

// AMI brand, taken from the African Musicology Institute logo.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#121642', 700: '#252A63', 500: '#4A5078', 100: '#E4E6F3', 50: '#F3F4FA' },
        maroon: { DEFAULT: '#600E17', 100: '#F6E6E8' },
        gold: { DEFAULT: '#E4AD22', 600: '#B98510', 100: '#FBF0D2' },
        sand: '#F7F3EA',
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: '1.25rem' },
    },
  },
  plugins: [],
};

export default config;
