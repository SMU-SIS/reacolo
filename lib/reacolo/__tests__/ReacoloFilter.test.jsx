import React from 'react';
import renderer from 'react-test-renderer';
import ReacoloFilter from '../ReacoloFilter';

describe('ReacoloFilter#wouldRender with roles', () => {
  it('is rendered when all roles are here', () => {
    const roles = 'role1 | role2 & role3 & role4?';
    const context = {
      roles: {
        role2: 2,
        role3: 1,
        role4: 0
      }
    };
    expect(ReacoloFilter.wouldRender(context, { roles })).toBe(true);
  });
  it('is rendered when all roles are here (pre-decoded)', () => {
    const roles = [{
      role1: { optional: false }
    }, {
      role2: { optional: false },
      role3: { optional: false },
      role4: { optional: true },
    }];
    const context = {
      roles: {
        role2: 2,
        role3: 1,
        role4: 0
      }
    };
    expect(ReacoloFilter.wouldRender(context, { roles })).toBe(true);
  });
  it('is not rendered when there are missing roles', () => {
    const roles = 'role1 & role2 & role3? | role2 & role3 | role4';
    const context = {
      roles: {
        role1: 2,
        role2: 0,
        role3: 1
      }
    };
    expect(ReacoloFilter.wouldRender(context, { roles })).toBe(false);
  });
  it('is not rendered when there are missing roles (pre-decoded)', () => {
    const roles = [
      { role1: { optional: false } },
      { role2: { optional: false } },
      { role3: { optional: true } }
    ];
    const context = {
      roles: {
        role1: 2,
        role2: 0,
        role3: 1
      }
    };
    expect(ReacoloFilter.wouldRender(context, { roles })).toBe(false);
  });
});

describe('ReacoloFilter#wouldRender with activity', () => {
  it('is rendered when the activity is one of the targets', () => {
    const activity = 'talking|walking';
    const context = {
      activity: 'walking'
    };
    expect(ReacoloFilter.wouldRender(context, { activity })).toBe(true);
  });
  it('is rendered when the activity is one of the targets (pre-decoded)', () => {
    const activity = [
      { talking: { optional: false } },
      { walking: { optional: false } }
    ];
    const context = {
      activity: 'walking'
    };
    expect(ReacoloFilter.wouldRender(context, { activity })).toBe(true);
  });
  it('is not rendered when the activity is not one of the targets', () => {
    const activity = 'talking|walking';
    const context = {
      activity: 'jogging'
    };
    expect(ReacoloFilter.wouldRender(context, { activity })).toBe(false);
  });
  it('is not rendered when the activity is not one of the targets (pre-decoded)', () => {
    const activity = [
      { talking: { optional: false } },
      { walking: { optional: false } }
    ];
    const context = {
      activity: 'jogging'
    };
    expect(ReacoloFilter.wouldRender(context, { activity })).toBe(false);
  });
});

describe('ReacoloFilter#wouldRender with clientRole', () => {
  it('is rendered when the clientRole is one of the targets', () => {
    const clientRole = 'role1|role2|role3';
    const context = {
      clientRole: 'role2'
    };
    expect(ReacoloFilter.wouldRender(context, { clientRole })).toBe(true);
  });
  it('is rendered when the clientRole is one of the targets (pre-decoded)', () => {
    const clientRole = [
      { role1: { optional: false } },
      { role2: { optional: false } },
      { role3: { optional: false } }
    ];
    const context = {
      clientRole: 'role2'
    };
    expect(ReacoloFilter.wouldRender(context, { clientRole })).toBe(true);
  });
  it('is not rendered when the clientRole is not one of the targets', () => {
    const clientRole = 'role1|role3';
    const context = {
      clientRole: 'role2'
    };
    expect(ReacoloFilter.wouldRender(context, { clientRole })).toBe(false);
  });
  it('is not rendered when the clientRole is not one of the targets (pre-decoded)', () => {
    const clientRole = [
      { role1: { optional: false } },
      { role3: { optional: false } }
    ];
    const context = {
      clientRole: 'role2'
    };
    expect(ReacoloFilter.wouldRender(context, { clientRole })).toBe(false);
  });
});

describe('ReacoloFilter', () => {
  const originalWouldRender = ReacoloFilter.wouldRender;
  beforeEach(() => {
    ReacoloFilter.wouldRender = jest.fn(() => true);
  });
  afterEach(() => {
    ReacoloFilter.wouldRender = originalWouldRender;
  });
  it('properly calls ReacoloFilter#wouldRender', () => {
    renderer.create(
      <ReacoloFilter
        activity="test-activity"
        clientRole="test-clientRole"
        roles="test-roles"
        context={{ uselessProp: 'just for the test', roles: { role1: 2 } }}
      >
        <div id="child" />
      </ReacoloFilter>
    );
    expect(ReacoloFilter.wouldRender.mock.calls).toEqual([[{
      uselessProp: 'just for the test',
      roles: { role1: 2 }
    }, {
      activity: 'test-activity',
      clientRole: 'test-clientRole',
      roles: 'test-roles'
    }]]);
  });
  it('renders if ReacoloFilter#wouldRender returns true', () => {
    ReacoloFilter.wouldRender.mockImplementation(() => true);
    const component = renderer.create(
      <ReacoloFilter context={{ roles: {} }}>
        <div id="child" />
      </ReacoloFilter>
    );
    expect(component.toJSON()).toMatchSnapshot();
  });
  it('does not render if ReacoloFilter#wouldRender returns false', () => {
    ReacoloFilter.wouldRender.mockImplementation(() => false);
    const component = renderer.create(
      <ReacoloFilter context={{ roles: {} }}>
        <div id="child" />
      </ReacoloFilter>
    );
    expect(component.toJSON()).toMatchSnapshot();
  });
});
