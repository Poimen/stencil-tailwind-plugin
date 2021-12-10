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

  it('given *no* configuration should set default options', () => {
    // Arrange & Act
    plugin();
    // Assert
    expect(getConfiguration()).toMatchSnapshot();
    expect(isDebugEnabled()).toBe(false);
  });

  it('given modified default configuration should set default options', () => {
    // Arrange
    const opts = Object.assign({}, PluginOpts.DEFAULT, { enableDebug: false, stripComments: true });
    // Act
    plugin(opts);
    // Assert
    expect(getConfiguration()).toMatchSnapshot();
    expect(isDebugEnabled()).toBe(false);
  });

  it('given configuration that does imports to another css file, should set options', async () => {
    // Arrange
    const loadedFile = loadTestComponent('configuration', 'config-component.tsx');
    const opts: PluginConfigOpts = {
      tailwindConf: tailwindFrozenConfig,
      tailwindCssPath: 'src/test/configuration/tailwind.atimport.css',
      atImportConf: {
        path: [
          'src/test/configuration'
        ]
      }
    };
    // Act
    plugin(opts);
    // Assert
    expect(getConfiguration()).toMatchSnapshot();
    expect(await processSourceTextForTailwindInlineClasses(loadedFile.path, true, null)).toMatchSnapshot();
  });

  it('given configuration that specifies autoprefixer config, should set options', async () => {
    // Arrange
    const loadedFile = loadTestComponent('configuration', 'config-component.tsx');
    const opts: PluginConfigOpts = {
      tailwindConf: tailwindFrozenConfig,
      tailwindCssPath: 'src/test/configuration/tailwind.css',
      autoprefixerOptions: {
        grid: 'autoplace'
      }
    };
    // Act
    plugin(opts);
    // Assert
    expect(getConfiguration()).toMatchSnapshot();
  });

  it('given full postcss configuration, should override options', async () => {
    // Arrange
    const loadedFile = loadTestComponent('configuration', 'config-component.tsx');
    const opts: PluginConfigOpts = {
      tailwindConf: tailwindFrozenConfig,
      tailwindCssPath: 'src/test/configuration/tailwind.atimport.css',
      // These configuration options should not be used, set for test purposes
      autoprefixerOptions: {
        grid: 'autoplace'
      },
      // This configuration should be used alone
      postcssConfig: 'src/test/configuration/postcss.config.js'
    };
    // Act
    plugin(opts);
    // Assert
    expect(getConfiguration()).toMatchSnapshot();
    expect(await processSourceTextForTailwindInlineClasses(loadedFile.path, undefined)).toMatchSnapshot();
  });
});
