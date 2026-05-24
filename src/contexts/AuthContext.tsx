import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { api } from '../lib/api';

export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  role?: string;
};

export type AuthState = {
  user: User | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
};

export type AuthContextType = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const initialState: AuthState = {
  user: null,
  status: 'loading',
};

type AuthAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_UNAUTHENTICATED' }
  | { type: 'SET_LOADING' };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, status: 'authenticated' };
    case 'SET_UNAUTHENTICATED':
      return { ...state, user: null, status: 'unauthenticated' };
    case 'SET_LOADING':
      return { ...state, status: 'loading' };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const refresh = async () => {
    try {
      // /api/auth/me uses cookies to verify session and return user data
      const response = await api.get('/auth/me');
      dispatch({ type: 'SET_USER', payload: response.data.user });
    } catch (error) {
      dispatch({ type: 'SET_UNAUTHENTICATED' });
    }
  };

  useEffect(() => {
    refresh();

    // Listen for custom logout event emitted by Axios interceptor on 401
    const handleForceLogout = () => {
      dispatch({ type: 'SET_UNAUTHENTICATED' });
    };

    window.addEventListener('kisanmart:logout', handleForceLogout);
    return () => window.removeEventListener('kisanmart:logout', handleForceLogout);
  }, []);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.accessToken) {
        localStorage.setItem('kisanmart_accessToken', response.data.accessToken);
      }
      if (response.data.refreshToken) {
        localStorage.setItem('kisanmart_refreshToken', response.data.refreshToken);
      }
      dispatch({ type: 'SET_USER', payload: response.data.user });
    } catch (error) {
      dispatch({ type: 'SET_UNAUTHENTICATED' });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      localStorage.removeItem('kisanmart_token'); // Legacy
      localStorage.removeItem('kisanmart_user'); // Legacy
      localStorage.removeItem('kisanmart_accessToken');
      localStorage.removeItem('kisanmart_refreshToken');
      dispatch({ type: 'SET_UNAUTHENTICATED' });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
