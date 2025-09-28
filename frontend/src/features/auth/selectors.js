export const selectAuthState = (state) => state.auth;

export const selectCurrentUser = (state) => {
  try {
    return state.auth?.user || null;
  } catch (error) {
    console.error('Error accessing auth state:', error);
    return null;
  }
};

export const selectCurrentUserId = (state) => {
  try {
    return state.auth?.user?.id || null;
  } catch (error) {
    console.error('Error accessing user id:', error);
    return null;
  }
};

export const selectCurrentUserRole = (state) => {
  try {
    return state.auth?.user?.role || null;
  } catch (error) {
    console.error('Error accessing user role:', error);
    return null;
  }
};

export const selectIsAdmin = (state) => {
  try {
    return state.auth?.user?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin role:', error);
    return false;
  }
};

export const selectIsAuthenticated = (state) => {
  try {
    return !!state.auth?.isAuthenticated;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

export const selectAuthLoading = (state) => {
  try {
    return state.auth?.loading || false;
  } catch (error) {
    console.error('Error accessing auth loading:', error);
    return false;
  }
};

export const selectAuthError = (state) => {
  try {
    return state.auth?.error || null;
  } catch (error) {
    console.error('Error accessing auth error:', error);
    return null;
  }
};