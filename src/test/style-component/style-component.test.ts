import { transformCssFromTsxFileFormat as transform } from '../../processors/stylesheets';
import { loadTestComponent } from '../utils';
import { configurePluginOptions, PluginConfigDefaults } from '../../config/pluginConfiguration';
import { PluginConfigurationOptions } from '../..';

describe('style-component', () => {
  it('given style component with no tailwindcss styles, should output unaltered styles', async () => {
    // Arrange
    const loadedFile = loadTestComponent('style-component', 'style-component.tsx');
    // Act
    const result = await transform(configurePluginOptions(PluginConfigDefaults.DEFAULT))(loadedFile.text, loadedFile.path);
    // Assert
    expect(result).toMatchSnapshot();
  });

  it('given style component with tailwindcss styles, should output styles', async () => {
    // Arrange
    const loadedFile = loadTestComponent('style-component', 'style-component-tailwind.tsx');
    // Act
    const result = await transform(configurePluginOptions(PluginConfigDefaults.DEFAULT))(loadedFile.text, loadedFile.path);
    // Assert
    expect(result).toMatchSnapshot();
  });

  it('given style component with tailwindcss function configuration, should output styles configured with new file configuration', async () => {
    // Arrange
    const twConfigurationFn = jest.fn(() => '');

    const pluginConf: PluginConfigurationOptions = {
      ...PluginConfigDefaults.DEFAULT,
      injectTailwindConfiguration: twConfigurationFn,
    };

    const loadedFile = loadTestComponent('style-component', 'style-component-tailwind.tsx');
    // Act
    const result = await transform(configurePluginOptions(pluginConf))(loadedFile.text, loadedFile.path);
    // Assert
    expect(result).toMatchSnapshot();
  });
});
