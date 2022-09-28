import plugin, { PluginConfigOpts, PluginOpts } from '../../index';
import { configuredTransform } from '../../plugin';
import { isDebugEnabled } from '../../debug/logger';

jest.mock('../../plugin');

describe('configuration', () => {
  let tailwindFrozenConfig: any;
  beforeAll(() => {
    const config = { conf: require('./tailwind.config') };
    tailwindFrozenConfig = Object.freeze(config.conf);
  });

  const mockTransformModule = () => {
    let confSet: PluginConfigOpts | null = null;

    configuredTransform.mockImplementation((opts: PluginConfigOpts) => {
      confSet = opts;
    });

    return {
      conf: () => confSet
    };
  };

  it('given no configuration should set default options', () => {
    // Arrange & Act
    const { conf } = mockTransformModule();

    plugin();
    // Assert
    expect(conf()).toMatchSnapshot();
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
      minify: false
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
      postcss: 'src/test/configuration/postcss.config.js'
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
          require('autoprefixer')
        ]
      }
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
      minify: false
    };
    // Act
    const result = plugin(opts);
    // Assert
    expect(conf()).toMatchSnapshot();
    expect(isDebugEnabled()).toBe(true);
    expect(result.name).toBe('tailwind');
  });
});
