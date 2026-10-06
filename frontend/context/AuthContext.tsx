'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, fetchAPI, getAuthToken, GearItem } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  gearKit: GearItem[];
  addGearItem: (name: string, category: string) => Promise<void>;
  removeGearItem: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [gearKit, setGearKit] = useState<GearItem[]>([
    { id: '1', name: 'Duct Tape (Heavy Duty)', category: 'Repair', inPack: true },
    { id: '2', name: 'Paracord (550lb, 20ft)', category: 'Cordage', inPack: true },
    { id: '3', name: 'Zip Ties (Assorted 8-inch)', category: 'Hardware', inPack: true },
    { id: '4', name: 'Seam Sealer / Super Glue', category: 'Adhesive', inPack: true },
    { id: '5', name: 'Multi-Tool & Pliers', category: 'Hardware', inPack: true }
  ]);

  // Load user profile on mount if token exists
  useEffect(() => {
    const savedToken = getAuthToken();
    if (savedToken) {
      setToken(savedToken);
      fetchAPI('/auth/me')
        .then(userData => {
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('field_medic_token');
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  // Fetch pack gear
  useEffect(() => {
    fetchAPI('/gear')
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setGearKit(data);
        }
      })
      .catch(err => console.log('Using default gear kit:', err));
  }, [user]);

  const login = async (email: string, pass: string) => {
    const data = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass })
    });
    localStorage.setItem('field_medic_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (name: string, email: string, pass: string) => {
    const data = await fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password: pass })
    });
    localStorage.setItem('field_medic_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('field_medic_token');
    setToken(null);
    setUser(null);
  };

  const addGearItem = async (name: string, category: string) => {
    try {
      const item = await fetchAPI('/gear', {
        method: 'POST',
        body: JSON.stringify({ name, category })
      });
      setGearKit(prev => [...prev, item]);
    } catch (err) {
      const fallbackItem: GearItem = {
        id: 'mem_' + Date.now(),
        name,
        category,
        inPack: true
      };
      setGearKit(prev => [...prev, fallbackItem]);
    }
  };

  const removeGearItem = async (id: string) => {
    try {
      await fetchAPI(`/gear/${id}`, { method: 'DELETE' });
    } catch (err) {}
    setGearKit(prev => prev.filter(item => item.id !== id && item._id !== id));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        gearKit,
        addGearItem,
        removeGearItem
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
