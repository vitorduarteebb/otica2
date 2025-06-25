import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Filters = ({ onFiltersChange, showStoreFilter = true, showDateFilter = true, showCategoryFilter = false, showPaymentFilter = false, showStockFilter = false, showSellerFilter = false }) => {
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    store: '',
    start_date: '',
    end_date: '',
    category: '',
    payment_method: '',
    stock_level: '',
    seller: '',
    product_name: ''
  });

  useEffect(() => {
    if (showStoreFilter && user.role === 'admin') {
      fetchStores();
    }
    if (showSellerFilter) {
      fetchSellers();
    }
    if (showCategoryFilter) {
      fetchCategories();
    }
  }, [showStoreFilter, showSellerFilter, showCategoryFilter, user.role]);

  const fetchStores = async () => {
    try {
      const response = await api.get('/api/stores/');
      setStores(response.data.results || response.data || []);
    } catch (error) {
      console.error('Erro ao buscar lojas:', error);
    }
  };

  const fetchSellers = async () => {
    try {
      const response = await api.get('/api/sellers/');
      setSellers(response.data.results || response.data || []);
    } catch (error) {
      console.error('Erro ao buscar vendedores:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories/');
      setCategories(response.data.results || response.data || []);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      store: '',
      start_date: '',
      end_date: '',
      category: '',
      payment_method: '',
      stock_level: '',
      seller: '',
      product_name: ''
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Filtros</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Limpar Filtros
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {showStoreFilter && user.role === 'admin' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loja
            </label>
            <select
              value={filters.store}
              onChange={(e) => handleFilterChange('store', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as Lojas</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {showDateFilter && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Final
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {showCategoryFilter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as Categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {showPaymentFilter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Método de Pagamento
            </label>
            <select
              value={filters.payment_method}
              onChange={(e) => handleFilterChange('payment_method', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os Métodos</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao_credito">Cartão de Crédito</option>
              <option value="cartao_debito">Cartão de Débito</option>
              <option value="pix">PIX</option>
            </select>
          </div>
        )}

        {showStockFilter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nível de Estoque
            </label>
            <select
              value={filters.stock_level}
              onChange={(e) => handleFilterChange('stock_level', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os Níveis</option>
              <option value="normal">Estoque Normal (≥5)</option>
              <option value="low">Estoque Baixo (&lt;5)</option>
              <option value="out">Sem Estoque (0)</option>
            </select>
          </div>
        )}

        {showSellerFilter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendedor
            </label>
            <select
              value={filters.seller}
              onChange={(e) => handleFilterChange('seller', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os Vendedores</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Produto
          </label>
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={filters.product_name}
            onChange={(e) => handleFilterChange('product_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default Filters; 