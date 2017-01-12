/* eslint-env jest */

import React from 'react';
import renderer from 'react-test-renderer';
import ValueFilter from '../reacolo/ValueFilter';

test('ValueFilter renders if the value is the target.', () => {
  const component = renderer.create(
    <ValueFilter target="test" value="test" >
      child
    </ValueFilter>
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('ValueFilter does not render if the value role is not the target.', () => {
  const component = renderer.create(
    <ValueFilter target="test" value="something-else" >
      child
    </ValueFilter>
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('ValueFilter renders if the value is one of the targets.', () => {
  const component = renderer.create(
    <ValueFilter target={['target1', 'target2', 'target3']} value="target2" >
      child
    </ValueFilter>
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('ValueFilter does not render if the value role is not one of the targets.', () => {
  const component = renderer.create(
    <ValueFilter target={['target1', 'target2', 'target3']} value="something-else" >
      child
    </ValueFilter>
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
