import React, { useState, useEffect } from 'react';
import { ShoppingCart, PlusCircle, Eye, Trash, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCashTill } from '../../contexts/CashTillContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Filters from '../../components/Filters';

const Sales = () => {
  const { isTillOpen, isLoading: isTillLoading } = useCashTill();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [editingSale, setEditingSale] = useState(null);
  const [filters, setFilters] = useState({});
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    payment_method: 'dinheiro',
    seller: '',
    items: [{ product: '', quantity: 1, unit_price: 0 }],
    cliente: '',
  });
  const [clientes, setClientes] = useState([]);
  const [clienteBusca, setClienteBusca] = useState('');

  useEffect(() => {
    fetchSales();
    fetchProducts();
    fetchSellers();
    fetchClientes();
  }, [filters]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/sales/', { params: filters });
      setSales(response.data.results || response.data || []);
    } catch (error) {
      toast.error('Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products/');
      setProducts(response.data.results || response.data || []);
    } catch (error) {
      toast.error('Erro ao carregar produtos');
    }
  };

  const fetchSellers = async () => {
    try {
      const response = await api.get('/api/sellers/');
      setSellers(response.data.results || response.data || []);
    } catch (error) {
      toast.error('Erro ao carregar vendedores');
    }
  };

  const fetchClientes = async () => {
    try {
      const res = await api.get('/api/clientes/');
      setClientes(res.data.results || res.data);
    } catch (e) {
      setClientes([]);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleFormChange = (e, index) => {
    if (e.target.name === 'product' || e.target.name === 'quantity') {
      const newItems = [...formData.items];
      newItems[index][e.target.name] = e.target.value;
      if (e.target.name === 'product') {
        const product = products.find(p => p.id === parseInt(e.target.value));
        newItems[index].unit_price = product ? product.price : 0;
      }
      setFormData({ ...formData, items: newItems });
    } else if (e.target.name === 'cliente') {
      setFormData({ ...formData, cliente: e.target.value });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const addItem = () => {
    setFormData({ ...formData, items: [...formData.items, { product: '', quantity: 1, unit_price: 0 }] });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSale) {
        await api.put(`/api/sales/${editingSale.id}/`, formData);
        toast.success('Venda atualizada com sucesso!');
      } else {
        await api.post('/api/sales/', formData);
        toast.success('Venda registrada com sucesso!');
      }
      setShowModal(false);
      setEditingSale(null);
      setFormData({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        payment_method: 'dinheiro',
        seller: '',
        items: [{ product: '', quantity: 1, unit_price: 0 }],
        cliente: '',
      });
      fetchSales();
    } catch (error) {
      console.error('Erro ao registrar venda:', error.response?.data);
      const errorMsg = error.response?.data?.detail || 'Erro ao salvar venda.';
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta venda?')) {
      try {
        await api.delete(`/api/sales/${id}/`);
        fetchSales();
        toast.success('Venda excluída com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir venda');
      }
    }
  };
  
  const openDetailsModal = (sale) => {
    setSelectedSale(sale);
    setShowDetailsModal(true);
  };

  if (loading || isTillLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Vendas</h1>
        <div className="relative group">
          <button
            onClick={() => isTillOpen && setShowModal(true)}
            className={`bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center transition-all ${
              !isTillOpen
                ? 'bg-gray-400 cursor-not-allowed'
                : 'hover:bg-blue-600'
            }`}
            disabled={!isTillOpen}
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Nova Venda
          </button>
          {!isTillOpen && (
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-max bg-gray-700 text-white text-xs rounded py-1 px-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              Abra o caixa para registrar vendas.
            </div>
          )}
        </div>
      </div>

      {!isTillOpen && !isTillLoading && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg mb-6 flex items-center" role="alert">
          <AlertTriangle className="h-6 w-6 mr-3" />
          <div>
            <p className="font-bold">Caixa Fechado!</p>
            <p>
              Você precisa abrir o caixa para poder registrar novas vendas. 
              <Link to="/admin/cash-till" className="font-semibold underline hover:text-yellow-800 ml-1">
                Ir para a Gestão de Caixa
              </Link>
            </p>
          </div>
        </div>
      )}

      <Filters onFiltersChange={handleFilterChange} showCategoryFilter showPaymentFilter showSellerFilter />

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl">
            <h2 className="text-xl font-semibold mb-4">{editingSale ? 'Editar Venda' : 'Nova Venda'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cliente</label>
                  <input
                    type="text"
                    placeholder="Buscar por nome, CPF ou email..."
                    value={clienteBusca}
                    onChange={e => setClienteBusca(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                  <select
                    name="cliente"
                    value={formData.cliente || ''}
                    onChange={handleFormChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    {clientes.filter(c =>
                      c.nome.toLowerCase().includes(clienteBusca.toLowerCase()) ||
                      (c.cpf && c.cpf.includes(clienteBusca)) ||
                      (c.email && c.email.toLowerCase().includes(clienteBusca.toLowerCase()))
                    ).map(c => (
                      <option key={c.id} value={c.id}>{c.nome} {c.cpf ? `- ${c.cpf}` : ''}</option>
                    ))}
                  </select>
                  <div className="text-xs text-gray-500 mt-1">Não encontrou? <Link to="/admin/clientes">Cadastre um novo cliente</Link></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email do Cliente</label>
                  <input type="email" name="customer_email" value={formData.customer_email} onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefone do Cliente</label>
                  <input type="tel" name="customer_phone" value={formData.customer_phone} onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendedor</label>
                  <select name="seller" value={formData.seller} onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required>
                    <option value="">Selecione um vendedor</option>
                    {sellers.map(seller => (
                      <option key={seller.id} value={seller.id}>{seller.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                  <select name="payment_method" value={formData.payment_method} onChange={handleFormChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="pix">PIX</option>
                  </select>
                </div>
              </div>

              <h3 className="text-lg font-semibold mt-4">Itens da Venda</h3>
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-end border-b pb-4 mb-4">
                  <div className="col-span-4">
                    <label className="block text-sm font-medium text-gray-700">Produto</label>
                    <select name="product" value={item.product} onChange={(e) => handleFormChange(e, index)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required>
                      <option value="">Selecione um produto</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Quantidade</label>
                    <input type="number" name="quantity" value={item.quantity} onChange={(e) => handleFormChange(e, index)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" min="1" required/>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Preço Unit.</label>
                    <input type="text" value={`R$ ${parseFloat(item.unit_price).toFixed(2)}`} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100" readOnly />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Subtotal</label>
                    <input type="text" value={`R$ ${(item.quantity * item.unit_price).toFixed(2)}`} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100" readOnly />
                  </div>
                  <div className="col-span-2">
                    <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 px-4 py-2 mt-6">Remover</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addItem} className="text-blue-500 hover:text-blue-700">+ Adicionar Item</button>
              
              <div className="text-right font-semibold text-xl mt-4">
                Total da Venda: R$ {formData.items.reduce((acc, item) => acc + item.quantity * item.unit_price, 0).toFixed(2)}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">Cancelar</button>
                <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">{editingSale ? 'Atualizar' : 'Registrar Venda'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showDetailsModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Detalhes da Venda #{selectedSale.id}</h2>
            <p><strong>Cliente:</strong> {selectedSale.customer_name}</p>
            <p><strong>Email:</strong> {selectedSale.customer_email}</p>
            <p><strong>Telefone:</strong> {selectedSale.customer_phone}</p>
            <p><strong>Vendedor:</strong> {selectedSale.seller_name}</p>
            <p><strong>Data:</strong> {new Date(selectedSale.sale_date).toLocaleString()}</p>
            <p><strong>Pagamento:</strong> {selectedSale.payment_method}</p>
            <p><strong>Total:</strong> R$ {parseFloat(selectedSale.total_amount).toFixed(2)}</p>
            <h3 className="text-lg font-semibold mt-4">Itens:</h3>
            <ul>
              {selectedSale.items.map(item => (
                <li key={item.id}>{item.quantity}x {item.product_name} - R$ {parseFloat(item.unit_price).toFixed(2)}</li>
              ))}
            </ul>
            <button onClick={() => setShowDetailsModal(false)} className="mt-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">Fechar</button>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td className="px-6 py-4 whitespace-nowrap">{sale.customer_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{sale.seller_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(sale.sale_date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">R$ {parseFloat(sale.total_amount).toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => openDetailsModal(sale)} className="text-blue-600 hover:text-blue-900">
                    <Eye className="h-5 w-5" />
                  </button>
                  <button onClick={() => handleDelete(sale.id)} className="text-red-600 hover:text-red-900 ml-2">
                    <Trash className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Sales; 