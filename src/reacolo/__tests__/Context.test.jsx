import React from 'react';
import renderer from 'react-test-renderer';
import Context from '../Context';

test('Context cannot be directly rendered', () => {
  expect(() => {
    renderer.create(<Context />);
  }).toThrow();
});
