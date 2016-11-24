/* eslint-env jest */

import React from 'react';
import renderer from 'react-test-renderer';
import ComponentFilter from '../ComponentFilter';

test('ComponentFilter renders itself and its children when rendered is true', () => {
  const component = renderer.create(
    <div id="container">
      <ComponentFilter rendered>
        <div id="child" />
      </ComponentFilter>
    </div>
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('ComponentFilter is not rendered when rendered is false', () => {
  const component = renderer.create(
    <div id="container">
      <ComponentFilter rendered={false}>
        <div id="child" />
      </ComponentFilter>
    </div>
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
