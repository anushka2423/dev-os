import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './contexts/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // allNeurons Design System v1.3.0
        'bg-page': '#FAFAFA',
        'bg-surface': '#FFFFFF',
        // Ink (text)
        'ink-900': '#080A0E',
        'ink-600': '#3D3F42',
        'ink-400': '#7E8185',
        // Line (borders, dividers)
        'line-100': '#F0F0F0',
        'line-200': '#DADADB',
        // Blue (primary)
        'blue-50': '#E6EFFC',
        'blue-600': '#125ACB',
        'blue-700': '#0E469E',
        // Green (success / high confidence)
        'green-50': '#E7F7E7',
        'green-500': '#12A10D',
        'green-700': '#0D720B',
        // Orange (warning / medium confidence)
        'orange-50': '#FFF7ED',
        'orange-500': '#FA9200',
        'orange-700': '#B45309',
        // Red (error / low confidence)
        'red-50': '#FEF2F2',
        'red-500': '#D23438',
        'red-700': '#942529',
        // Purple (MSA badge)
        'purple-50': '#F3F0FF',
        'purple-700': '#5B21B6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
