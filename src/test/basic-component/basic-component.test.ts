import { transform } from '../../processors/typescript';
import { loadTestComponent } from '../utils';
import { configurePluginOptions } from '../../config/pluginConfiguration';
import * as conf from '../../config/pluginConfiguration';

describe('basic-component', () => {
  beforeEach(() => {
    conf.configurePluginOptions(conf.PluginConfigOpts.DEFAULT);
  });

  it('given basic component with no tailwindcss styles, should output unaltered styles', async () => {
    // Arrange
    const loadedFile = loadTestComponent('basic-component', 'basic-component.tsx');
    // Act
    const result = await transform(loadedFile.text, loadedFile.path);
    // Assert
    expect(result).toMatchSnapshot();
  });

  it('given basic component *with* tailwindcss styles, should output tailwind styles appended', async () => {
    // Arrange
    const loadedFile = loadTestComponent('basic-component', 'basic-component-tailwind.tsx');
    // Act
    const result = await transform(loadedFile.text, loadedFile.path);
    // Assert
    expect(result).toMatchSnapshot();
  });

  it('given basic component *with* tailwindcss styles, should strip comments', async () => {
    // Arrange
    const loadedFile = loadTestComponent('basic-component', 'basic-component-tailwind.tsx');
    configurePluginOptions(Object.assign({}, conf.PluginConfigOpts.DEFAULT, { stripComments: true }));
    // Act
    const result = await transform(loadedFile.text, loadedFile.path);
    // Assert
    expect(result).toMatchSnapshot();
  });
});
