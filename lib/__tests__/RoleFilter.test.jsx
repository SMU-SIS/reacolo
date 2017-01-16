import React from 'react';
import renderer from 'react-test-renderer';
import RoleFilter from '../reacolo/RoleFilter';

test('RoleFilter renders if the context\'s role is the target role.', () => {
  const component = renderer.create(
    <div id="container">
      <RoleFilter target="test" context={{ role: 'test' }} >
        <div id="child" />
      </RoleFilter>
    </div>
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('RoleFilter does not render if the context\'s role is not the target role.', () => {
  const component = renderer.create(
    <div id="container">
      <RoleFilter target="test" context={{ role: 'something-else' }} >
        <div id="child" />
      </RoleFilter>
    </div>
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('RoleFilter renders if the context\'s role same is one of the targets.', () => {
  const targets = ['target1', 'target2', 'target3'];
  const context = { role: 'target2' };
  const component = renderer.create(
    <div id="container">
      <RoleFilter target={targets} context={context} >
        <div id="child" />
      </RoleFilter>
    </div>
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('RoleFilter does not render if the context\'s role is not one of the targets.', () => {
  const targets = ['target1', 'target2', 'target3'];
  const context = { role: 'something-else' };
  const component = renderer.create(
    <div id="container">
      <RoleFilter target={targets} context={context} >
        <div id="child" />
      </RoleFilter>
    </div>
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
