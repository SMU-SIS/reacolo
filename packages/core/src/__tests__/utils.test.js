// import React from 'react';
import { lowerizeFirstLetter } from '../utils.js';

test('lowerizeFirstLetter', () => {
  expect(lowerizeFirstLetter('FooBar')).toBe('fooBar');
  expect(lowerizeFirstLetter('fooBar')).toBe('fooBar');
  expect(lowerizeFirstLetter('47FooBar')).toBe('47FooBar');
});
