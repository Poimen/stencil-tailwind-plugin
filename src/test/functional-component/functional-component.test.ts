import { transform as transformTypescript } from '../../processors/typescript';
import { transform as transformStylesheet } from '../../processors/stylesheets';
import { loadTestComponent } from '../utils';

describe('functional-component', () => {
  it('given functional component in same file as component, should output tailwind styles', async () => {
    // Arrange
    const loadedFile = loadTestComponent('functional-component', 'functional-component.tsx');
    // Act
    const result = await transformTypescript(loadedFile.text, loadedFile.path);
    // Assert
    expect(result).toMatchSnapshot();
  });

  it('given functional class component in the same file as component, should output tailwind styles', async () => {
    // Arrange
    const loadedFile = loadTestComponent('functional-component', 'functional-component-class.tsx');
    // Act
    const result = await transformTypescript(loadedFile.text, loadedFile.path);
    // Assert
    expect(result).toMatchSnapshot();
  });

  it('given functional class component in imported file to component, should output tailwind styles from functional import and component', async () => {
    // Arrange
    const component = loadTestComponent('functional-component', 'externally-included-functional-component.tsx');
    const fcComponents = loadTestComponent('functional-component', 'FunctionalComponent.tsx');
    const componentStyles = loadTestComponent('functional-component', 'basic-component.css');

    // Stencil loads components, then FCs, then styles. We add FC styles to final component styles as this is the last usable point to inject them without
    // inspecting imported files for tailwind classes
    await transformTypescript(component.text, component.path);
    await transformTypescript(fcComponents.text, fcComponents.path);
    // Act
    const result = await transformStylesheet(componentStyles.text, `${componentStyles.path}?tag=basic-component&encapsulation=shadow`);
    // Assert
    expect(result).toMatchSnapshot();
  });
});
