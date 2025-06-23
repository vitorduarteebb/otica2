import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash, Filter, Eye } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from 'react-modal';
import { useAuth } from '../../contexts/AuthContext';

Modal.setAppElement('#root');

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState(null);
  const [filters, setFilters] = useState({ status: '' });

  useEffect(() => {
    fetchOrders();
    fetchSellers();
    if (user.role === 'admin') {
      fetchStores();
    }
  }, [filters, user.role]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/orders/', { params: filters });
      setOrders(response.data.results || response.data);
    } catch (error) {
      toast.error('Erro ao buscar pedidos.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSellers = async () => {
    try {
      const response = await api.get('/api/sellers/');
      setSellers(response.data.results || response.data);
    } catch (error) {
      toast.error('Erro ao buscar vendedores.');
    }
  };

  const fetchStores = async () => {
    try {
      const response = await api.get('/api/stores/');
      setStores(response.data.results || response.data);
    } catch (error) {
      toast.error('Erro ao buscar lojas.');
    }
  };
  
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const openModal = (order = null) => {
    setSelectedOrder(order);
    setFormData(order ? { ...order } : {
      customer_name: '', customer_phone: '', seller: '', store: '',
      sphere_right: '', cylinder_right: '', axis_right: '', addition_right: '', dnp_right: '', height_right: '',
      sphere_left: '', cylinder_left: '', axis_left: '', addition_left: '', dnp_left: '', height_left: '',
      lens_description: '', frame_description: '', notes: '', total_price: '', status: 'realizando'
    });
    setIsModalOpen(true);
  };

  const openDetailModal = (order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
    setFormData(null);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedOrder(null);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const dataToSubmit = { ...formData };
    const nullableFields = [
      'customer_phone', 'seller', 'store',
      'sphere_right', 'cylinder_right', 'axis_right', 'addition_right', 'dnp_right', 'height_right',
      'sphere_left', 'cylinder_left', 'axis_left', 'addition_left', 'dnp_left', 'height_left'
    ];

    for (const key of nullableFields) {
      if (dataToSubmit[key] === '') {
        dataToSubmit[key] = null;
      }
    }

    try {
      if (selectedOrder) {
        await api.put(`/api/orders/${selectedOrder.id}/`, dataToSubmit);
        toast.success('Pedido atualizado com sucesso!');
      } else {
        await api.post('/api/orders/', dataToSubmit);
        toast.success('Pedido criado com sucesso!');
      }
      fetchOrders();
      closeModal();
    } catch (error) {
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : 'Erro ao salvar pedido.';
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este pedido?')) {
      try {
        await api.delete(`/api/orders/${id}/`);
        toast.success('Pedido excluído com sucesso!');
        fetchOrders();
      } catch (error) {
        toast.error('Erro ao excluir pedido.');
      }
    }
  };
  
  const renderMeasurementFields = (side) => {
    const sidePrefix = side === 'Direito' ? 'right' : 'left';
    const fields = ['sphere', 'cylinder', 'axis', 'addition', 'dnp', 'height'];
    const labels = ['Esférico', 'Cilíndrico', 'Eixo', 'Adição', 'DNP', 'Altura'];

    return (
      <div className="p-4 border rounded-lg">
        <h4 className="text-md font-semibold mb-2">Olho {side}</h4>
        <div className="grid grid-cols-3 gap-4">
          {fields.map((field, index) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700">{labels[index]}</label>
              <input type="number" name={`${field}_${sidePrefix}`} value={formData?.[`${field}_${sidePrefix}`] || ''} onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderOrderDetails = (order) => {
    if (!order) return null;
    return (
        <div className="space-y-4">
            <div><strong>Cliente:</strong> {order.customer_name}</div>
            <div><strong>Telefone:</strong> {order.customer_phone}</div>
            <div><strong>Vendedor:</strong> {order.seller_name}</div>
            <div><strong>Status:</strong> <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(order.status)}`}>{order.status}</span></div>
            <div><strong>Preço Total:</strong> R$ {order.total_price}</div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                    <h4 className="font-semibold">Olho Direito</h4>
                    <p>Esférico: {order.sphere_right}</p>
                    <p>Cilíndrico: {order.cylinder_right}</p>
                    <p>Eixo: {order.axis_right}</p>
                    <p>Adição: {order.addition_right}</p>
                    <p>DNP: {order.dnp_right}</p>
                    <p>Altura: {order.height_right}</p>
                </div>
                <div>
                    <h4 className="font-semibold">Olho Esquerdo</h4>
                    <p>Esférico: {order.sphere_left}</p>
                    <p>Cilíndrico: {order.cylinder_left}</p>
                    <p>Eixo: {order.axis_left}</p>
                    <p>Adição: {order.addition_left}</p>
                    <p>DNP: {order.dnp_left}</p>
                    <p>Altura: {order.height_left}</p>
                </div>
            </div>

            <div><h4 className="font-semibold">Descrição das Lentes:</h4><p>{order.lens_description}</p></div>
            <div><h4 className="font-semibold">Descrição da Armação:</h4><p>{order.frame_description}</p></div>
            <div><h4 className="font-semibold">Observações:</h4><p>{order.notes}</p></div>
        </div>
    );
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'realizando': return 'bg-yellow-100 text-yellow-800';
      case 'pronto': return 'bg-blue-100 text-blue-800';
      case 'entregue': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pedidos Personalizados</h1>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center">
          <PlusCircle className="mr-2" /> Novo Pedido
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold">Filtros</h3>
            <select name="status" value={filters.status} onChange={handleFilterChange} className="border-gray-300 rounded-md shadow-sm">
                <option value="">Todos os Status</option>
                <option value="realizando">Realizando</option>
                <option value="pronto">Pronto</option>
                <option value="entregue">Entregue</option>
            </select>
        </div>
      </div>
      
      {loading ? <p>Carregando...</p> : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map(order => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{order.customer_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{order.seller_name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">R$ {order.total_price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openDetailModal(order)} className="text-indigo-600 hover:text-indigo-900 mr-3"><Eye /></button>
                    <button onClick={() => openModal(order)} className="text-blue-600 hover:text-blue-900 mr-3"><Edit /></button>
                    <button onClick={() => handleDelete(order.id)} className="text-red-600 hover:text-red-900"><Trash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      <Modal isOpen={isModalOpen} onRequestClose={closeModal} contentLabel="Formulário de Pedido" className="bg-white rounded-lg shadow-xl p-8 m-4 max-w-4xl mx-auto" overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        {formData && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-bold">{selectedOrder ? 'Editar Pedido' : 'Novo Pedido'}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Cliente</label>
                    <input type="text" name="customer_name" value={formData.customer_name} onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Telefone</label>
                    <input type="text" name="customer_phone" value={formData.customer_phone} onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Vendedor</label>
                    <select name="seller" value={formData.seller} onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                        <option value="">Selecione um vendedor</option>
                        {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                {user.role === 'admin' && (
                  <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700">Loja</label>
                      <select name="store" value={formData.store} onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required>
                          <option value="">Selecione uma loja</option>
                          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                  </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderMeasurementFields('Direito')}
                {renderMeasurementFields('Esquerdo')}
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Descrição das Lentes</label>
                    <textarea name="lens_description" value={formData.lens_description} onChange={handleFormChange} rows="3" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Descrição da Armação</label>
                    <textarea name="frame_description" value={formData.frame_description} onChange={handleFormChange} rows="3" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Observações</label>
                <textarea name="notes" value={formData.notes} onChange={handleFormChange} rows="3" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Preço Total</label>
                    <input type="number" step="0.01" name="total_price" value={formData.total_price} onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select name="status" value={formData.status} onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                        <option value="realizando">Realizando</option>
                        <option value="pronto">Pronto</option>
                        <option value="entregue">Entregue</option>
                    </select>
                </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button type="button" onClick={closeModal} className="bg-gray-200 px-4 py-2 rounded-md">Cancelar</button>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md">Salvar</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onRequestClose={closeDetailModal} contentLabel="Detalhes do Pedido" className="bg-white rounded-lg shadow-xl p-8 m-4 max-w-4xl mx-auto" overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div className="space-y-6">
            <h2 className="text-xl font-bold">Detalhes do Pedido #{selectedOrder?.id}</h2>
            {renderOrderDetails(selectedOrder)}
            <div className="flex justify-end">
                <button type="button" onClick={closeDetailModal} className="bg-gray-200 px-4 py-2 rounded-md">Fechar</button>
            </div>
        </div>
      </Modal>

    </div>
  );
};

export default Orders;
