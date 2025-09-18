import authReducer, { setCredentials, logout } from '../authSlice';

describe('auth reducer', () => {
  const initialState = {
    accessToken: null,
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false
  };

  it('should handle initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toBeTruthy();
  });

  it('should handle setCredentials', () => {
    const action = setCredentials({ accessToken: 'abc', user: { id: 1, name: 'Ivan' }});
    const state = authReducer(initialState, action);
    expect(state.accessToken).toBe('abc');
    expect(state.user.name).toBe('Ivan');
    expect(state.isAuthenticated).toBe(true);
  });

  it('should handle logout', () => {
    const loggedIn = { ...initialState, accessToken: 'abc', user: { id: 1 }, isAuthenticated: true };
    const state = authReducer(loggedIn, logout());
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
