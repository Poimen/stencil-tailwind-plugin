import { transform } from '../../processors/typescript';
import { loadTestComponent } from '../utils';
import { configurePluginOptions, PluginConfigDefaults } from '../../config/pluginConfiguration';

describe('class-component', () => {
  it('given class component with no tailwindcss styles, should output unaltered styles', async () => {
    // Arrange
    const loadedFile = loadTestComponent('class-component', 'class-component.tsx');
    // Act
    const result = await transform(configurePluginOptions(PluginConfigDefaults.DEFAULT))(loadedFile.text, loadedFile.path);
    // Assert
    expect(result).toMatchSnapshot();
  });

  it('given class component with no tailwindcss styles and other get accessors, should output unaltered styles', async () => {
    // Arrange
    const loadedFile = loadTestComponent('class-component', 'class-component-get-accessor.tsx');
    // Act
    const result = await transform(configurePluginOptions(PluginConfigDefaults.DEFAULT))(loadedFile.text, loadedFile.path);
    // Assert
    expect(result).toMatchSnapshot();
  });

  it('given class component with tailwindcss styles, should output unaltered styles', async () => {
    // Arrange
    const loadedFile = loadTestComponent('class-component', 'class-component-tailwind.tsx');
    // Act
    const result = await transform(configurePluginOptions(PluginConfigDefaults.DEFAULT))(loadedFile.text, loadedFile.path);
    // Assert
    expect(result).toMatchSnapshot();
  });

  it('given class component with tailwindcss styles and other get accessors, should output unaltered styles', async () => {
    // Arrange
    const loadedFile = loadTestComponent('class-component', 'class-component-get-accessor-tailwind.tsx');
    // Act
    const result = await transform(configurePluginOptions(PluginConfigDefaults.DEFAULT))(loadedFile.text, loadedFile.path);
    // Assert
    expect(result).toMatchSnapshot();
  });
});
