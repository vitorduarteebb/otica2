import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Filters from '../../components/Filters';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState({
    total: 0,
    count: 0,
    average: 0,
    byMonth: []
  });
  const [productsData, setProductsData] = useState({
    total: 0,
    lowStock: [],
    topSelling: []
  });

  const handleFiltersChange = async (filters) => {
    setLoading(true);
    await fetchData(filters);
  };

  const fetchData = async (filters = {}) => {
    setLoading(true);
    try {
      const salesRes = await api.get(`/api/reports/sales/`, { params: filters });
      setSalesData(salesRes.data);

      const productsRes = await api.get(`/api/reports/products/`, { params: filters });
      setProductsData(productsRes.data);
    } catch (error) {
      toast.error('Erro ao buscar relatórios');
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BarChart3 className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
      </div>

      <Filters 
        onFiltersChange={handleFiltersChange}
        showStoreFilter={true}
        showDateFilter={true}
        showCategoryFilter={true}
        showPaymentFilter={true}
        showSellerFilter={true}
      />

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total de Vendas</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(salesData.total)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Número de Vendas</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {salesData.count}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Ticket Médio</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(salesData.average)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Vendas por Mês */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Vendas por Mês</h2>
        <div className="h-64">
          {salesData.byMonth && salesData.byMonth.length > 0 ? (
            <div className="flex h-full items-end space-x-2">
              {salesData.byMonth.map((month) => (
                <div
                  key={month.month}
                  className="flex-1 flex flex-col items-center"
                >
                  <div
                    className="w-full bg-blue-500 rounded-t"
                    style={{
                      height: `${salesData.total > 0 ? (month.total / salesData.total) * 100 : 0}%`
                    }}
                  ></div>
                  <p className="mt-2 text-sm text-gray-500">{month.month}</p>
                  <p className="text-xs text-gray-400">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(month.total)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Nenhum dado de vendas disponível
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Produtos Mais Vendidos */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Produtos Mais Vendidos</h2>
          <div className="space-y-4">
            {productsData.topSelling && productsData.topSelling.length > 0 ? (
              productsData.topSelling.map((product) => (
                <div
                  key={product['product__name']}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Package className="h-5 w-5 text-blue-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product['product__name']}</p>
                      <p className="text-xs text-gray-500">{product.quantity} vendas</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(product.total)}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                Nenhum produto vendido recentemente
              </div>
            )}
          </div>
        </div>

        {/* Produtos com Estoque Baixo */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Produtos com Estoque Baixo</h2>
          <div className="space-y-4">
            {productsData.lowStock && productsData.lowStock.length > 0 ? (
              productsData.lowStock.map((product) => (
                <div
                  key={product['product__id']}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Package className="h-5 w-5 text-red-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product['product__name']}</p>
                      <p className="text-xs text-gray-500">{product['product__category']}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{product.quantity} unidades</p>
                    <p className="text-xs text-red-500">Estoque baixo</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                Nenhum produto com estoque baixo
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports; 