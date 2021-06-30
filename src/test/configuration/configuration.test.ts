import plugin, { PluginConfigOpts, PluginOpts } from '../../index';
import * as conf from '../../config/pluginConfiguration';
import * as log from '../../debug/logger';

describe('configuration', () => {
  it('given configuration should set options', () => {
    // Arrange
    const opts: PluginConfigOpts = {
      enableDebug: true,
      tailwindCssPath: 'src/test/configuration/tailwindcss.css',
      tailwindCssContents: '',
      tailwindConf: require('./tailwind.config'),
      stripComments: true,
      minify: false,
      enablePurge: false,
      purgeSafeList: ['Im', 'safe']
    };
    // Act
    const result = plugin(opts);
    // Assert
    expect(conf.getConfiguration()).toMatchSnapshot();
    expect(log.isDebugEnabled()).toBe(true);
    expect(result.name).toBe('tailwind');
    expect(typeof result.buildStart).toBe(typeof Function);
    expect(typeof result.buildEnd).toBe(typeof Function);
  });

  it('given *no* configuration should set default options', () => {
    // Arrange & Act
    plugin();
    // Assert
    expect(conf.getConfiguration()).toMatchSnapshot();
    expect(log.isDebugEnabled()).toBe(false);
  });

  it('given modified default configuration should set default options', () => {
    // Arrange
    const opts = Object.assign({}, PluginOpts.DEFAULT, { enableDebug: false, stripComments: true });
    // Act
    plugin(opts);
    // Assert
    expect(conf.getConfiguration()).toMatchSnapshot();
    expect(log.isDebugEnabled()).toBe(false);
  });
});
