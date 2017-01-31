import React from 'react';
import renderer from 'react-test-renderer';
import ReacoloGroup from '../ReacoloGroup';
import ReacoloFilter from '../ReacoloFilter';

jest.mock('../ReacoloFilter');

beforeEach(() => {
  ReacoloFilter.mockClear();
  ReacoloFilter.prototype.render.mockImplementation(function render() {
    return <div>{this.props.children}</div>;
  });
});

describe('ReacoloGroup', () => {
  it('properly calls wouldRender on its child', () => {
    renderer.create(
      <ReacoloGroup context={{ roles: { test: 'test' } }}>
        <ReacoloFilter
          activity="activity1"
          clientRole="clientRole1"
          roles="roles1"
        >
          child filter 1
        </ReacoloFilter>
        <ReacoloFilter
          activity="activity2"
          clientRole="clientRole2"
          roles="roles2"
        >
          child filter 2
        </ReacoloFilter>
        <ReacoloFilter
          activity="activity3"
          clientRole="clientRole3"
          roles="roles3"
        >
          child filter 3
        </ReacoloFilter>
      </ReacoloGroup>
    );

    expect(ReacoloFilter.wouldRender.mock.calls).toEqual([
      [
        { roles: { test: 'test' } },
        { activity: 'activity1',
          clientRole: 'clientRole1',
          roles: 'roles1' }
      ], [
        { roles: { test: 'test' } },
        { activity: 'activity2',
          clientRole: 'clientRole2',
          roles: 'roles2' }
      ], [
        { roles: { test: 'test' } },
        { activity: 'activity3',
          clientRole: 'clientRole3',
          roles: 'roles3' }
      ]
    ]);
  });
  it('renders the first filters that passes', () => {
    ReacoloFilter.wouldRender.mockImplementation((_, { clientRole }) => clientRole === 'ok');
    const component = renderer.create(
      <ReacoloGroup context={{ roles: {} }}>
        <ReacoloFilter>Not to be rendered</ReacoloFilter>
        <ReacoloFilter clientRole="ok">To be rendered</ReacoloFilter>
        <ReacoloFilter clientRole="ok">Not to be rendered</ReacoloFilter>
      </ReacoloGroup>
    );
    expect(ReacoloFilter.mock.instances.length).toBe(1);
    expect(component.toJSON()).toMatchSnapshot();
  });
  it('injects the override property to the child it renders', () => {
    ReacoloFilter.wouldRender.mockImplementation((_, { clientRole }) => clientRole === 'ok');
    renderer.create(
      <ReacoloGroup context={{ roles: {} }}>
        <ReacoloFilter testProp="bar">Not to be rendered</ReacoloFilter>
        <ReacoloFilter clientRole="ok" testProp="foo">To be rendered</ReacoloFilter>
      </ReacoloGroup>
    );
    expect(ReacoloFilter.mock.instances.length).toBe(1);
    expect(ReacoloFilter.mock.instances[0].props).toEqual({
      clientRole: 'ok',
      children: 'To be rendered',
      testProp: 'foo',
      override: true
    });
  });
  it('does not render if no filters would render and there is no default filter', () => {
    ReacoloFilter.wouldRender.mockReturnValue(false);
    const component = renderer.create(
      <ReacoloGroup context={{ roles: {} }}>
        <ReacoloFilter>Not to be rendered</ReacoloFilter>
        <ReacoloFilter>Not to be rendered</ReacoloFilter>
      </ReacoloGroup>
    );
    expect(ReacoloFilter.mock.instances.length).toBe(0);
    expect(component.toJSON()).toMatchSnapshot();
  });
  it('renders the default filter if none would render', () => {
    ReacoloFilter.wouldRender.mockReturnValue(false);
    const component = renderer.create(
      <ReacoloGroup context={{ roles: {} }}>
        <ReacoloFilter>Not to be rendered</ReacoloFilter>
        <ReacoloFilter default>Default Filter Content</ReacoloFilter>
        <ReacoloFilter>Not to be rendered</ReacoloFilter>
      </ReacoloGroup>
    );
    expect(ReacoloFilter.mock.instances.length).toBe(1);
    expect(component.toJSON()).toMatchSnapshot();
  });
  it('renders the filter that would render even if there is a default filter', () => {
    ReacoloFilter.wouldRender.mockImplementation((_, { clientRole }) => clientRole === 'ok');
    const component = renderer.create(
      <ReacoloGroup context={{ roles: {} }}>
        <ReacoloFilter>Not to be rendered</ReacoloFilter>
        <ReacoloFilter clientRole="ok">To be rendered</ReacoloFilter>
        <ReacoloFilter default>Default Filter Content</ReacoloFilter>
        <ReacoloFilter clientRole="ok">Not to be rendered</ReacoloFilter>
        <ReacoloFilter>Not to be rendered</ReacoloFilter>
      </ReacoloGroup>
    );
    expect(ReacoloFilter.mock.instances.length).toBe(1);
    expect(component.toJSON()).toMatchSnapshot();
  });
  it('renders the filter that would render even it comes after the default filter', () => {
    ReacoloFilter.wouldRender.mockImplementation((_, { clientRole }) => clientRole === 'ok');
    const component = renderer.create(
      <ReacoloGroup context={{ roles: {} }}>
        <ReacoloFilter>Not to be rendered</ReacoloFilter>
        <ReacoloFilter default>Default Filter Content</ReacoloFilter>
        <ReacoloFilter clientRole="ok">To be rendered</ReacoloFilter>
        <ReacoloFilter clientRole="ok">Not to be rendered</ReacoloFilter>
      </ReacoloGroup>
    );
    expect(ReacoloFilter.mock.instances.length).toBe(1);
    expect(component.toJSON()).toMatchSnapshot();
  });
});
