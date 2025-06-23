import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CashTillContext = createContext({});

export const CashTillProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useAuth();

  const fetchCurrentSession = useCallback(async () => {
    if (!isAuthenticated || !user || !user.store) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/cash-till-sessions/status/');
      if (response.data && response.data.status === 'aberto') {
        setSession(response.data);
      } else {
        setSession(null);
      }
    } catch (err) {
      setError('Falha ao buscar o status do caixa.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchCurrentSession();
  }, [fetchCurrentSession]);

  const openTill = async (initial_amount, storeId) => {
    try {
      const payload = storeId ? { initial_amount: parseFloat(initial_amount), store: storeId } : { initial_amount: parseFloat(initial_amount) };
      const response = await api.post('/api/cash-till-sessions/open/', payload);
      setSession(response.data);
      return { success: true, data: response.data };
    } catch (err) {
      console.error("Erro ao abrir caixa:", err.response?.data);
      const errorData = err.response?.data || {};
      const messages = Object.values(errorData).flat();
      const errorMessage = messages.length > 0 ? messages.join(' ') : 'Erro ao abrir o caixa.';
      return { success: false, error: errorMessage };
    }
  };

  const closeTill = async (sessionId, final_amount_reported, notes) => {
    try {
      const response = await api.post(`/api/cash-till-sessions/${sessionId}/close/`, { final_amount_reported, notes });
      setSession(null); // Caixa foi fechado
      return { success: true, data: response.data };
    } catch (err) {
      console.error("Erro ao fechar caixa:", err.response?.data);
      const errorData = err.response?.data || {};
      const messages = Object.values(errorData).flat();
      const errorMessage = messages.length > 0 ? messages.join(' ') : 'Erro ao fechar o caixa.';
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    session,
    isTillOpen: !!session,
    isLoading,
    error,
    fetchCurrentSession,
    openTill,
    closeTill,
  };

  return (
    <CashTillContext.Provider value={value}>
      {children}
    </CashTillContext.Provider>
  );
};

export const useCashTill = () => {
  const context = useContext(CashTillContext);
  if (!context) {
    throw new Error('useCashTill deve ser usado dentro de um CashTillProvider');
  }
  return context;
}; 