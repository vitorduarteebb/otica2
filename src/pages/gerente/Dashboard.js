import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Glasses
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    totalSellers: 0,
    todaySales: 0,
    todayRevenue: 0,
    avgSaleValue: 0
  });
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch products
      const productsResponse = await api.get('/api/products/');
      const products = productsResponse.data.results || productsResponse.data;
      
      // Fetch sellers
      const sellersResponse = await api.get('/api/sellers/');
      const sellers = sellersResponse.data.results || sellersResponse.data;
      
      // Fetch sales
      const salesResponse = await api.get('/api/sales/');
      const sales = salesResponse.data.results || salesResponse.data;
      
      // Calculate today's stats
      const today = new Date().toISOString().split('T')[0];
      const todaySales = sales.filter(sale => 
        sale.sale_date.startsWith(today)
      );
      
      const todayRevenue = todaySales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
      
      const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
      const avgSaleValue = sales.length > 0 ? totalRevenue / sales.length : 0;
      
      // Find low stock items (less than 10 units)
      const lowStock = products.filter(product => product.quantity < 10);
      
      setStats({
        totalProducts: products.length,
        lowStockProducts: lowStock.length,
        totalSellers: sellers.length,
        todaySales: todaySales.length,
        todayRevenue,
        avgSaleValue
      });

      setLowStockItems(lowStock);
      setRecentSales(sales.slice(0, 5)); // Last 5 sales
      
    } catch (error) {
      toast.error('Erro ao carregar dados do dashboard');
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <Glasses className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Dashboard da Loja</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Package className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Estoque Baixo</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStockProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Users className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vendedores</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSellers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vendas Hoje</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todaySales}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Receita Hoje</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {stats.todayRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {stats.avgSaleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            Produtos com Estoque Baixo
          </h3>
          {lowStockItems.length > 0 ? (
            <div className="space-y-3">
              {lowStockItems.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">Quantidade: {product.quantity}</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                    Crítico
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Nenhum produto com estoque baixo</p>
          )}
        </div>

        {/* Recent Sales */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ShoppingCart className="h-5 w-5 text-blue-500 mr-2" />
            Vendas Recentes
          </h3>
          {recentSales.length > 0 ? (
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Venda #{sale.id}</p>
                    <p className="text-sm text-gray-600">
                      {sale.seller_name} • {new Date(sale.sale_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      R$ {sale.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{sale.payment_method}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Nenhuma venda registrada</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/admin/sales" className="flex items-center justify-center p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors duration-200">
            <ShoppingCart className="h-6 w-6 text-blue-600 mr-2" />
            <span className="font-medium text-blue-600">Nova Venda</span>
          </Link>
          <Link to="/admin/inventory" className="flex items-center justify-center p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors duration-200">
            <Package className="h-6 w-6 text-green-600 mr-2" />
            <span className="font-medium text-green-600">Gerenciar Estoque</span>
          </Link>
          <Link to="/admin/cash-till" className="flex items-center justify-center p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors duration-200">
            <DollarSign className="h-6 w-6 text-purple-600 mr-2" />
            <span className="font-medium text-purple-600">Fluxo de Caixa</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 