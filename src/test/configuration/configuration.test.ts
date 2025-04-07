import plugin, { PluginConfigurationOptions, setPluginConfigurationDefaults, TailwindPluginFunctionalConfig, tailwindHMR, tailwindGlobal, PluginOptions } from '../../index';
import { configuredTransform, postTransformDependencyUpdate, processGlobalStyles } from '../../plugin';
import { isDebugEnabled } from '../../debug/logger';

jest.mock('../../plugin');

describe('configuration', () => {
  const mockTransformModule = () => {
    let confSet: PluginConfigurationOptions | null = null;
    let postTransformConfSet: PluginConfigurationOptions | null = null;
    let globalStylesConfSet: PluginConfigurationOptions | null = null;

    configuredTransform.mockImplementation((opts: PluginConfigurationOptions) => {
      confSet = opts;
    });

    postTransformDependencyUpdate.mockImplementation((opts: PluginConfigurationOptions) => {
      postTransformConfSet = opts;
    });

    processGlobalStyles.mockImplementation((opts: PluginConfigurationOptions) => {
      globalStylesConfSet = opts;
    });

    return {
      conf: () => confSet,
      postTransformConf: () => postTransformConfSet,
      globalStylesConf: () => globalStylesConfSet,
    };
  };

  it('given no configuration should set default options', () => {
    // Arrange & Act
    const { conf } = mockTransformModule();

    plugin();
    const confResult = conf();
    // Assert
    expect(confResult).toMatchSnapshot();
    expect((confResult?.injectTailwindConfiguration as TailwindPluginFunctionalConfig)('')).toMatchSnapshot();
    expect(isDebugEnabled()).toBe(false);
  });

  it('given default configuration should match default options', () => {
    // Arrange & Act
    const { conf } = mockTransformModule();

    plugin(PluginOptions.DEFAULT);
    // Assert
    expect(conf()).toMatchSnapshot();
  });

  it('given configuration should set options', () => {
    // Arrange
    const { conf } = mockTransformModule();

    const opts: PluginConfigurationOptions = {
      enableDebug: true,
      tailwindCssPath: 'src/test/configuration/tailwind.css',
      stripComments: true,
      minify: false,
    };
    // Act
    const result = plugin(opts);
    // Assert
    expect(conf()).toMatchSnapshot();
    expect(isDebugEnabled()).toBe(true);
    expect(result.name).toBe('tailwind');
  });

  it('given configuration should set options', () => {
    // Arrange
    const { conf } = mockTransformModule();

    const opts: PluginConfigurationOptions = {
      enableDebug: true,
      tailwindCssPath: 'src/test/configuration/tailwind.css',
      injectTailwindConfiguration: jest.fn(() => ''),
      stripComments: true,
      minify: false,
    };
    // Act
    const result = plugin(opts);
    // Assert
    expect(conf()).toMatchSnapshot();
    expect(isDebugEnabled()).toBe(true);
    expect(result.name).toBe('tailwind');
  });

  it('changing the default configuration should apply the configuration to all plugins', () => {
    // Arrange
    const { conf, globalStylesConf, postTransformConf } = mockTransformModule();

    const opts: PluginConfigurationOptions = {
      enableDebug: true,
      tailwindCssPath: 'src/test/configuration/tailwind.css',
      injectTailwindConfiguration: jest.fn(() => ''),
      stripComments: true,
      minify: false,
    };
    // Act
    setPluginConfigurationDefaults(opts);

    const result = plugin();
    const resultGlobal = tailwindGlobal();
    const resultHMR = tailwindHMR();
    // Assert
    expect(conf()).toMatchSnapshot();
    expect(globalStylesConf()).toMatchSnapshot();
    expect(postTransformConf()).toMatchSnapshot();

    expect(conf()).toEqual(globalStylesConf());
    expect(postTransformConf()).toEqual(conf());
    expect(globalStylesConf()).toEqual(postTransformConf());

    expect(result.name).toBe('tailwind');
    expect(resultGlobal.name).toBe('tailwind-global');
    expect(resultHMR.name).toBe('tailwind-hmr');
  });

  it('changing the default configuration plugins should be able to set own config', () => {
    // Arrange
    const { conf, globalStylesConf, postTransformConf } = mockTransformModule();

    const optsDefault: PluginConfigurationOptions = {
      enableDebug: true,
      tailwindCssPath: 'src/test/configuration/tailwind.css',
      injectTailwindConfiguration: jest.fn(() => ''),
      stripComments: true,
      minify: false,
    };

    const optsSingular: PluginConfigurationOptions = {
      enableDebug: false,
      tailwindCssPath: 'src/test/configuration/tailwind.css',
      injectTailwindConfiguration: jest.fn(() => ''),
      stripComments: false,
      minify: true,
    };
    // Act
    setPluginConfigurationDefaults(optsDefault);

    plugin(optsSingular);
    tailwindGlobal();
    tailwindHMR();
    // Assert
    expect(conf()).toMatchSnapshot();
    expect(globalStylesConf()).toMatchSnapshot();
    expect(postTransformConf()).toMatchSnapshot();

    expect(conf()).not.toEqual(globalStylesConf());
    expect(postTransformConf()).not.toEqual(conf());
    expect(globalStylesConf()).toEqual(postTransformConf());
  });
});
