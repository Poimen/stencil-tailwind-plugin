module.exports = {
  plugins: [
    require('postcss-import')({ path: './src/test/configuration' }),
    require('tailwindcss')({ config: './src/test/configuration/tailwind.config.js' }),
    require('autoprefixer'),
    require('postcss-sort-media-queries'),
    require('postcss-combine-duplicated-selectors'),
    require('cssnano'),
  ],
};
