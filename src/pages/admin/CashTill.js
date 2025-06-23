import React, { useState, useEffect } from 'react';
import { useCashTill } from '../../contexts/CashTillContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { DollarSign, BookOpen, Clock, AlertCircle, CheckCircle, List } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('pt-BR');
};

const OpenTillModal = ({ onOpen, onClose }) => {
  const [initialAmount, setInitialAmount] = useState('');
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user.role === 'admin') {
      api.get('/api/stores/').then(res => {
        setStores(res.data.results || res.data);
      });
    } else if (user.store) {
      setSelectedStore(user.store);
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!initialAmount || parseFloat(initialAmount) < 0) {
      toast.error('Por favor, insira um valor inicial válido.');
      return;
    }
    if (user.role === 'admin' && !selectedStore) {
      toast.error('Selecione a loja para abrir o caixa.');
      return;
    }
    onOpen(parseFloat(initialAmount), user.role === 'admin' ? selectedStore : undefined);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">Abrir Caixa</h2>
        <form onSubmit={handleSubmit}>
          {user.role === 'admin' && (
            <>
              <label className="block mb-2 text-sm font-medium">Loja</label>
              <select
                className="w-full px-3 py-2 border rounded-md mb-4"
                value={selectedStore}
                onChange={e => setSelectedStore(e.target.value)}
                required
              >
                <option value="">Selecione a loja</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </>
          )}
          <label className="block mb-2 text-sm font-medium">Valor Inicial (Fundo de Troco)</label>
          <input
            type="number"
            value={initialAmount}
            onChange={(e) => setInitialAmount(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Ex: 100.00"
            autoFocus
          />
          <div className="flex justify-end space-x-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-gray-600 bg-gray-100 hover:bg-gray-200">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Abrir Caixa</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CloseTillModal = ({ session, onClose, onConfirm }) => {
    const [finalAmount, setFinalAmount] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (finalAmount === '' || parseFloat(finalAmount) < 0) {
            toast.error('Por favor, insira um valor final válido.');
            return;
        }
        onConfirm(parseFloat(finalAmount), notes);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                <h2 className="text-xl font-bold mb-4">Fechar Caixa</h2>
                <form onSubmit={handleSubmit}>
                    <p className="mb-2">Aberto em: <span className="font-semibold">{formatDate(session.opened_at)}</span></p>
                    <p className="mb-4">Valor de Abertura: <span className="font-semibold">{formatCurrency(session.initial_amount)}</span></p>
                    <hr className="my-4"/>
                    <label className="block mb-2 text-sm font-medium">Valor Final Contado na Gaveta</label>
                    <input
                        type="number"
                        value={finalAmount}
                        onChange={(e) => setFinalAmount(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="Ex: 550.50"
                        autoFocus
                        required
                    />
                    <label className="block mt-4 mb-2 text-sm font-medium">Observações (Opcional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        rows="3"
                        placeholder="Alguma observação sobre o fechamento?"
                    />
                    <div className="flex justify-end space-x-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-gray-600 bg-gray-100 hover:bg-gray-200">Cancelar</button>
                        <button type="submit" className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700">Confirmar Fechamento</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const CashTill = () => {
  const { session, isTillOpen, isLoading, openTill, closeTill, fetchCurrentSession } = useCashTill();
  const [history, setHistory] = useState([]);
  const [isOpeningModal, setIsOpeningModal] = useState(false);
  const [sessionToClose, setSessionToClose] = useState(null);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/api/cash-till-sessions/');
      setHistory(response.data.results || response.data);
    } catch (error) {
      toast.error('Falha ao carregar o histórico de caixa.');
      console.error(error);
    }
  };

  useEffect(() => {
    fetchHistory();
    // A chamada ao fetchCurrentSession já está no contexto, não precisa aqui.
  }, []);

  const handleOpenTill = async (initialAmount, storeId) => {
    const { success, error } = await openTill(initialAmount, storeId);
    if (success) {
      toast.success('Caixa aberto com sucesso!');
      setIsOpeningModal(false);
      fetchHistory(); // Refresh history
      fetchCurrentSession(); // Refresh status
    } else {
      toast.error(error);
    }
  };
  
  const handleCloseTill = async (finalAmount, notes) => {
    if (!sessionToClose) return;
    const { success, data, error } = await closeTill(sessionToClose.id, finalAmount, notes);
    if (success) {
        toast.success(`Caixa fechado! Diferença: ${formatCurrency(data.difference)}`);
        setSessionToClose(null);
        fetchHistory(); // Refresh history
        fetchCurrentSession(); // Refresh status
    } else {
        toast.error(error);
    }
  };

  const renderStatusCard = () => {
    if (isLoading) return <div>Carregando status do caixa...</div>;

    if (isTillOpen) {
      return (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg" role="alert">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 mr-3" />
            <div>
                <p className="font-bold">Caixa Aberto</p>
                <p>Loja: {session.store_name}</p>
                <p>Aberto em: {formatDate(session.opened_at)}</p>
                <p>Valor Inicial: {formatCurrency(session.initial_amount)}</p>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg" role="alert">
            <div className="flex items-center">
                <AlertCircle className="h-6 w-6 mr-3" />
                <div>
                    <p className="font-bold">Caixa Fechado</p>
                    <p>Abra o caixa para começar a registrar novas vendas.</p>
                </div>
            </div>
        </div>
      );
    }
  };
  
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <DollarSign className="mr-2"/> Gestão de Caixa
      </h1>
      
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4 flex items-center"><BookOpen className="mr-2"/>Status Atual</h2>
            {renderStatusCard()}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center">
             {!isTillOpen ? (
                <button 
                    onClick={() => setIsOpeningModal(true)}
                    className="px-6 py-3 text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 bg-blue-600 hover:bg-blue-700"
                >
                    Abrir Caixa
                </button>
             ) : (
                <button 
                    onClick={() => setSessionToClose(session)}
                    className="px-6 py-3 text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 bg-red-600 hover:bg-red-700"
                >
                    Fechar Caixa Atual
                </button>
             )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4 flex items-center"><List className="mr-2"/>Histórico de Sessões</h2>
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="py-2 px-4 text-left">Loja</th>
                        <th className="py-2 px-4 text-left">Abertura</th>
                        <th className="py-2 px-4 text-left">Fechamento</th>
                        <th className="py-2 px-4 text-left">Valor Inicial</th>
                        <th className="py-2 px-4 text-left">Valor Informado</th>
                        <th className="py-2 px-4 text-left">Valor Calculado</th>
                        <th className="py-2 px-4 text-left">Diferença</th>
                        <th className="py-2 px-4 text-left">Status</th>
                        <th className="py-2 px-4 text-left">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {history.map(s => (
                        <tr key={s.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-4">{s.store_name}</td>
                            <td className="py-2 px-4">{formatDate(s.opened_at)}</td>
                            <td className="py-2 px-4">{formatDate(s.closed_at)}</td>
                            <td className="py-2 px-4">{formatCurrency(s.initial_amount)}</td>
                            <td className="py-2 px-4">{formatCurrency(s.final_amount_reported)}</td>
                            <td className="py-2 px-4">{formatCurrency(s.final_amount_calculated)}</td>
                            <td className={`py-2 px-4 font-semibold ${s.difference > 0 ? 'text-green-600' : s.difference < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                                {formatCurrency(s.difference)}
                            </td>
                            <td className="py-2 px-4">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${s.status === 'aberto' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                                    {s.status}
                                </span>
                            </td>
                            <td className="py-2 px-4">
                                {s.status === 'aberto' && (
                                    <button 
                                        onClick={() => setSessionToClose(s)}
                                        className="text-red-600 hover:text-red-800 text-sm font-semibold"
                                        disabled={isTillOpen && s.id === session?.id}
                                        title={isTillOpen && s.id === session?.id ? "Use o botão principal 'Fechar Caixa Atual'" : "Fechar este caixa"}
                                    >
                                        Fechar
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {isOpeningModal && <OpenTillModal onClose={() => setIsOpeningModal(false)} onOpen={handleOpenTill} />}
      {sessionToClose && <CloseTillModal session={sessionToClose} onClose={() => setSessionToClose(null)} onConfirm={handleCloseTill} />}
    </div>
  );
};

export default CashTill; 