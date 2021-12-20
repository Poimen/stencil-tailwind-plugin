import plugin, { PluginConfigOpts, PluginOpts } from '../../index';
import { getConfiguration } from '../../config/pluginConfiguration';
import { isDebugEnabled } from '../../debug/logger';
import { processSourceTextForTailwindInlineClasses } from '../../helpers/tailwindcss';
import { loadTestComponent } from '../utils';

describe('configuration', () => {
  let tailwindFrozenConfig;
  beforeAll(() => {
    const config = { conf: require('./tailwind.config') };
    tailwindFrozenConfig = Object.freeze(config.conf);
  });

  it('given no configuration should set default options', () => {
    // Arrange & Act
    plugin();
    // Assert
    expect(getConfiguration()).toMatchSnapshot();
    expect(isDebugEnabled()).toBe(false);
  });

  it('given default configuration should match default options', () => {
    // Arrange & Act
    plugin(PluginOpts.DEFAULT);
    // Assert
    expect(getConfiguration()).toMatchSnapshot();
  });

  it('given configuration should set options', () => {
    // Arrange
    const opts: PluginConfigOpts = {
      enableDebug: true,
      tailwindCssPath: 'src/test/configuration/tailwind.css',
      tailwindCssContents: '',
      tailwindConf: tailwindFrozenConfig,
      stripComments: true,
      minify: false
    };
    // Act
    const result = plugin(opts);
    // Assert
    expect(getConfiguration()).toMatchSnapshot();
    expect(isDebugEnabled()).toBe(true);
    expect(result.name).toBe('tailwind');
    expect(typeof result.buildStart).toBe(typeof Function);
    expect(typeof result.buildEnd).toBe(typeof Function);
  });

  it('given full postcssrc configuration, should set postcssrc path', async () => {
    // Arrange
    const opts: PluginConfigOpts = {
      postcss: 'src/test/configuration/postcss.config.js'
    };
    // Act
    plugin(opts);
    // Assert
    expect(getConfiguration()).toMatchSnapshot();
  });

  it('given full postcss object configuration, should set postcss object', async () => {
    // Arrange
    const opts: PluginConfigOpts = {
      postcss: {
        plugins: [
          require('autoprefixer')
        ]
      }
    };
    // Act
    plugin(opts);
    // Assert
    expect(getConfiguration()).toMatchSnapshot();
  });
});
