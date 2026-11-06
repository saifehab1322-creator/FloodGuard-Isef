export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {
    colors: { navy: '#0a1628', panel: '#0f2238' },
    fontFamily: { sans: ['Cairo', 'Segoe UI', 'system-ui', 'sans-serif'] },
    keyframes: { fade: { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'none' } } },
    animation: { fade: 'fade .35s ease-out' },
  } },
};
