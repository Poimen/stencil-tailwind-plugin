import fs from 'fs-extra';
import path from 'path';
import { transform } from '../../typescript/transformer';

test('passes when value is null or undefined', () => {
  expect(null).toBeNil();
  expect(undefined).toBeNil();
  expect(true).not.toBeNil();
});

describe('basic-component', () => {
  it('given basic component with no tailwindcss styles, should output unaltered styles', async () => {
    // Arrange
    const component = fs.readFileSync(path.resolve(path.join('src', 'test', 'basic-component', 'files', 'basic-component.tsx'))).toString();
    // Act
    const result = await transform(component, 'basic-component.tsx');
    // Assert
    expect(result).toEqual(component);
  });

  it('given basic component *with* tailwindcss styles, should output tailwind styles appended', async () => {
    // Arrange
    const component = fs.readFileSync(path.resolve(path.join('src', 'test', 'basic-component', 'files', 'basic-component-tailwind.tsx'))).toString();
    // Act
    const result = await transform(component, 'basic-component.tsx');
    // Assert
    expect('hello world').toEndWith('world');
    expect(result).toEndWith("BasicComponent.style = '.flex{display:flex}.flex-col{flex-direction:column} ' + basicComponentStyle;");
  });
});
