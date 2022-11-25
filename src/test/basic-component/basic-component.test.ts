import { transform } from '../../processors/typescript';
import { loadTestComponent } from '../utils';
import { configurePluginOptions, PluginConfigDefaults } from '../../config/pluginConfiguration';
import { PluginConfigOpts } from '../..';

describe('basic-component', () => {
  it('given basic component with no tailwindcss styles, should output no styles', async () => {
    // Arrange
    const loadedFile = loadTestComponent('basic-component', 'basic-component.tsx');
    // Act
    const result = await transform(configurePluginOptions(PluginConfigDefaults.DEFAULT))(loadedFile.text, loadedFile.path);
    // Assert
    expect(result).toMatchSnapshot();
  });

  it('given basic component with tailwindcss styles, should output no styles', async () => {
    // Arrange
    const loadedFile = loadTestComponent('basic-component', 'basic-component-tailwind.tsx');
    // Act
    const result = await transform(configurePluginOptions(PluginConfigDefaults.DEFAULT))(loadedFile.text, loadedFile.path);
    // Assert
    expect(result).toMatchSnapshot();
  });

  it('given basic component with tailwindcss styles and configuration via function, should output no styles', async () => {
    // Arrange
    const twConfigurationFn = jest.fn(() => PluginConfigDefaults.DEFAULT.tailwindConf);
    const pluginConf = {
      ...PluginConfigDefaults.DEFAULT,
      tailwindConf: twConfigurationFn
    } as PluginConfigOpts;
    const loadedFile = loadTestComponent('basic-component', 'basic-component-tailwind.tsx');
    // Act
    const result = await transform(configurePluginOptions(pluginConf))(loadedFile.text, loadedFile.path);
    // Assert
    expect(result).toMatchSnapshot();
    expect(twConfigurationFn).toHaveBeenCalledWith(loadedFile.path, { content: [loadedFile.path], corePlugins: { preflight: false } });
  });
});
