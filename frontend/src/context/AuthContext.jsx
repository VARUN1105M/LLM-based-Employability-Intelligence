import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Set default auth headers if token is present
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  const fetchCurrentUser = async (authToken) => {
    try {
      const response = await axios.get('http://localhost:8000/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:8000/api/auth/login', { email, password });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      setToken(access_token);
      await fetchCurrentUser(access_token);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (fullName, email, password, role) => {
    try {
      await axios.post('http://localhost:8000/api/auth/register', {
        full_name: fullName,
        email,
        password,
        role
      });
      return await login(email, password);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
