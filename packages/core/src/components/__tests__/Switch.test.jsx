/* eslint "react/no-array-index-key": 0 */

import React from 'react';
import renderer from 'react-test-renderer';
import { Switch } from '../Switch.jsx';
import matchContext from '../../filtering/match-context.js';
import createMatcher from '../../filtering/create-matcher.js';
import ConnectedContext, { Context } from '../Context.jsx';

jest.mock('../../filtering/match-context.js');
jest.mock('../../filtering/create-matcher.js');
jest.mock('../Context.jsx');

describe('Switch', () => {
  beforeEach(() => {
    // The default mock implementation of create matcher returns all properties
    // under 'matcherArgs' property.
    createMatcher.mockReset();
    createMatcher.mockImplementation(x => ({ matcherArgs: x }));

    // The default mock implementation of matchContext returns true if
    // if matcher.matcherArgs.pass is true (matcher is its second argument).
    matchContext.mockReset();
    matchContext.mockImplementation((_, { matcherArgs }) => matcherArgs.pass);

    ConnectedContext.mockReset();
    ConnectedContext.mockImplementation(props => (
      <div className="connected-context">{props.children}</div>
    ));

    Context.mockReset();
    Context.mockImplementation(props => (
      <div className="context">{props.children}</div>
    ));
  });

  it('properly calls `createMatcher` then `matchContext` until `matchContext returns true', () => {
    matchContext.mockReturnValueOnce(false).mockReturnValueOnce(true);
    renderer.create(
      <Switch contextValue={{ contextProp: 'bar' }}>
        <ConnectedContext prop1="val1" />
        <ConnectedContext prop2="val2" />
        <ConnectedContext prop3="val3" />
      </Switch>,
    );
    expect(createMatcher.mock.calls).toEqual([
      [{ prop1: 'val1' }],
      [{ prop2: 'val2' }],
    ]);
    expect(matchContext.mock.calls).toEqual([
      [{ contextProp: 'bar' }, { matcherArgs: { prop1: 'val1' } }],
      [{ contextProp: 'bar' }, { matcherArgs: { prop2: 'val2' } }],
    ]);
  });

  it('renders the first context that passes', () => {
    const component = renderer.create(
      <Switch contextValue={{}}>
        <ConnectedContext pass={false}>Not rendered</ConnectedContext>
        <ConnectedContext pass>Rendered</ConnectedContext>
        <ConnectedContext pass>Not rendered</ConnectedContext>
      </Switch>,
    );
    expect(component.toJSON()).toMatchSnapshot();
  });

  it('does not render if no contexts would pass and there is no default context', () => {
    const component = renderer.create(
      <Switch contextValue={{}}>
        <ConnectedContext pass={false}>Not rendered</ConnectedContext>
        <ConnectedContext pass={false}>Not rendered</ConnectedContext>
        <ConnectedContext pass={false}>Not rendered</ConnectedContext>
      </Switch>,
    );
    expect(component.toJSON()).toMatchSnapshot();
  });

  it('renders the default context if no contexts would pass', () => {
    const component = renderer.create(
      <Switch contextValue={{}}>
        <ConnectedContext pass={false}>Not rendered</ConnectedContext>
        <ConnectedContext pass={false} default>
          Rendered
        </ConnectedContext>
        <ConnectedContext pass={false}>Not rendered</ConnectedContext>
      </Switch>,
    );
    expect(component.toJSON()).toMatchSnapshot();
  });

  it('renders the context that passes even if there is a default context', () => {
    const component = renderer.create(
      <Switch contextValue={{}}>
        <ConnectedContext pass={false}>Not rendered</ConnectedContext>
        <ConnectedContext pass={false} default>
          Not rendered
        </ConnectedContext>
        <ConnectedContext pass>Rendered</ConnectedContext>
        <ConnectedContext pass={false}>Not Rendered</ConnectedContext>
      </Switch>,
    );
    expect(component.toJSON()).toMatchSnapshot();
  });
});
