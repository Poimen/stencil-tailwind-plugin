import { transform } from '../../processors/typescript';
import { loadTestComponent } from '../utils';

describe('conditional-styles-component', () => {
  it('given basic component with conditional tailwindcss styles, should output tailwind styles', async () => {
    // Arrange
    const loadedFile = loadTestComponent('conditional-styles', 'conditional.tsx');
    // Act
    const result = await transform(loadedFile.text, loadedFile.path);
    // Assert
    expect(result).toMatchSnapshot();
  });

  it('given class component with conditional tailwindcss styles, should output tailwind styles', async () => {
    // Arrange
    const loadedFile = loadTestComponent('conditional-styles', 'conditional-class.tsx');
    // Act
    const result = await transform(loadedFile.text, loadedFile.path);
    // Assert
    expect(result).toMatchSnapshot();
  });
});
