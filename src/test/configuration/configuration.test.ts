import plugin, { PluginConfigOpts, PluginOpts, setPluginConfigurationDefaults, TailwindPluginFunctionalConfig, tailwindHMR, tailwindGlobal } from '../../index';
import { configuredTransform, postTransformDependencyUpdate, processGlobalStyles } from '../../plugin';
import { isDebugEnabled } from '../../debug/logger';

jest.mock('../../plugin');

describe('configuration', () => {
  const defaultConfInput = { content: [], corePlugins: { preflight: true } };

  let tailwindFrozenConfig: any;
  beforeAll(() => {
    const config = { conf: require('./tailwind.config') };
    tailwindFrozenConfig = Object.freeze(config.conf);
  });

  const mockTransformModule = () => {
    let confSet: PluginConfigOpts | null = null;
    let postTransformConfSet: PluginConfigOpts | null = null;
    let globalStylesConfSet: PluginConfigOpts | null = null;

    configuredTransform.mockImplementation((opts: PluginConfigOpts) => {
      confSet = opts;
    });

    postTransformDependencyUpdate.mockImplementation((opts: PluginConfigOpts) => {
      postTransformConfSet = opts;
    });

    processGlobalStyles.mockImplementation((opts: PluginConfigOpts) => {
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
    expect((confResult?.tailwindConf as TailwindPluginFunctionalConfig)('', defaultConfInput)).toMatchSnapshot();
    expect(isDebugEnabled()).toBe(false);
  });

  it('given default configuration should match default options', () => {
    // Arrange & Act
    const { conf } = mockTransformModule();

    plugin(PluginOpts.DEFAULT);
    // Assert
    expect(conf()).toMatchSnapshot();
  });

  it('given configuration should set options', () => {
    // Arrange
    const { conf } = mockTransformModule();

    const opts: PluginConfigOpts = {
      enableDebug: true,
      tailwindCssPath: 'src/test/configuration/tailwind.css',
      tailwindCssContents: '',
      tailwindConf: tailwindFrozenConfig,
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

  it('given full postcssrc configuration, should set postcssrc path', async () => {
    // Arrange
    const { conf } = mockTransformModule();

    const opts: PluginConfigOpts = {
      postcss: 'src/test/configuration/postcss.config.js',
    };
    // Act
    plugin(opts);
    // Assert
    expect(conf()).toMatchSnapshot();
  });

  it('given full postcss object configuration, should set postcss object', async () => {
    // Arrange
    const { conf } = mockTransformModule();

    const opts: PluginConfigOpts = {
      postcss: {
        plugins: [
          require('autoprefixer'),
        ],
      },
    };
    // Act
    plugin(opts);
    // Assert
    expect(conf()).toMatchSnapshot();
  });

  it('given configuration should set options', () => {
    // Arrange
    const { conf } = mockTransformModule();

    const opts: PluginConfigOpts = {
      enableDebug: true,
      tailwindCssPath: 'src/test/configuration/tailwind.css',
      tailwindCssContents: '',
      tailwindConf: jest.fn(() => ({ content: [] })),
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

  it('changing the default configuration should not change the provided defaults', () => {
    // Arrange
    const preOpts = JSON.parse(JSON.stringify(PluginOpts));
    const opts: PluginConfigOpts = {
      enableDebug: true,
      tailwindCssPath: 'src/test/configuration/tailwind.css',
      tailwindCssContents: '',
      tailwindConf: jest.fn(() => ({ content: [] })),
      stripComments: true,
      minify: false,
    };
    // Act
    const result = setPluginConfigurationDefaults(opts);
    // Assert
    expect(PluginOpts).toEqual(preOpts);
    expect(result).not.toEqual(preOpts);
    expect(result).toMatchSnapshot();
  });

  it('changing the default configuration should apply the configuration to all plugins', () => {
    // Arrange
    const { conf, globalStylesConf, postTransformConf } = mockTransformModule();

    const opts: PluginConfigOpts = {
      enableDebug: true,
      tailwindCssPath: 'src/test/configuration/tailwind.css',
      tailwindCssContents: '',
      tailwindConf: jest.fn(() => ({ content: [] })),
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

    const optsDefault: PluginConfigOpts = {
      enableDebug: true,
      tailwindCssPath: 'src/test/configuration/tailwind.css',
      tailwindCssContents: '',
      tailwindConf: jest.fn(() => ({ content: [] })),
      stripComments: true,
      minify: false,
    };

    const optsSingular: PluginConfigOpts = {
      enableDebug: false,
      tailwindCssPath: 'src/test/configuration/tailwind.css',
      tailwindCssContents: '',
      tailwindConf: jest.fn(() => ({ content: [] })),
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
