/* eslint-env jest */

import React from 'react';
import renderer from 'react-test-renderer';
import EcologyFilter from '../EcologyFilter';

test('by default, EcologyFilter renders if all target roles are taken.', () => {
  const target = ['role1', 'role2'];
  const context = {
    roleAssignations: {
      role1: 2,
      role2: 1,
      role3: 1
    }
  };
  const component = renderer.create(
    <div id="container">
      <EcologyFilter target={target} context={context} >
        <div id="child" />
      </EcologyFilter>
    </div>
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('By default, EcologyFilter does not render if there is one target role that is not taken.', () => {
  const target = ['role1', 'role2'];
  const context = {
    roleAssignations: {
      role1: 2,
      role3: 1
    }
  };
  const component = renderer.create(
    <div id="container">
      <EcologyFilter target={target} context={context} >
        <div id="child" />
      </EcologyFilter>
    </div>
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('In strict mode, EcologyFilter renders if all target roles are taken and there is no extraneous roles.', () => {
  const target = ['role1', 'role2'];
  const context = {
    roleAssignations: {
      role1: 2,
      role2: 1
    }
  };
  const component = renderer.create(
    <div id="container">
      <EcologyFilter target={target} context={context} method="strict" >
        <div id="child" />
      </EcologyFilter>
    </div>
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('In strict mode, EcologyFilter does not render if there is a taken role that is not in target.', () => {
  const target = ['role1', 'role2'];
  const context = {
    roleAssignations: {
      role1: 2,
      role2: 1,
      role3: 1
    }
  };
  const component = renderer.create(
    <div id="container">
      <EcologyFilter target={target} context={context} method="strict" >
        <div id="child" />
      </EcologyFilter>
    </div>
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
