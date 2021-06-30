module.exports = {
  mode: 'jit',
  purge: {
    enabled: true,
    content: [
      './src/**/*.html',
      './src/**/*.js',
      './src/**/*.jsx',
      './src/**/*.tsx'
    ]
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {}
  },
  variants: {
    extend: {}
  },
  plugins: []
};
