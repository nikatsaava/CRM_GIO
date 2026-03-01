import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('tale_token');
    if (!token) { setLoading(false); return; }
    getMe()
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem('tale_token'))
      .finally(() => setLoading(false));
  }, []);

  const loginUser = (token, userData) => {
    localStorage.setItem('tale_token', token);
    setUser(userData);
  };

  const logoutUser = () => {
    localStorage.removeItem('tale_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
