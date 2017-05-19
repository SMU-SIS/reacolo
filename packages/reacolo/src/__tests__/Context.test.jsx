import Context from '../Context';
import bindContext from '../bind-context';

jest.mock('../bind-context.js', () => jest.fn(() => 'foo'));

describe('Context', () => {
  it('is just the default results of bind-context', () => {
    expect(Context).toBe('foo');
    expect(bindContext.mock.calls).toEqual([[]]);
  });
});
