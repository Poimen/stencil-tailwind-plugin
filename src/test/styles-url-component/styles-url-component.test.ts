import { transform } from '../../processors/typescript';
import { loadTestComponent } from '../utils';

describe('styles-url-component', () => {
  it('given component that uses style urls, should output tailwind styles for each mode', async () => {
    // Arrange
    const loadedFile = loadTestComponent('styles-url-component', 'mode-component.tsx');
    // Act
    const result = await transform(loadedFile.text, loadedFile.path);
    // Assert
    expect(result).toMatchSnapshot();
  });
});
