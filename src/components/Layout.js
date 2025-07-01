import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  Home,
  Users,
  Store,
  Package,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  BarChart,
  Archive,
  UserSquare,
  Glasses,
  DollarSign,
  ClipboardList,
  Tag,
  TrendingUp
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(navigate);
    toast.success('Você saiu com segurança!');
  };

  const navLinks = [
    { name: 'Dashboard', href: user?.role === 'admin' ? '/admin/dashboard' : '/gerente/dashboard', icon: Home, roles: ['admin', 'gerente'] },
    { name: 'Pedidos', href: user?.role === 'admin' ? '/admin/orders' : '/gerente/orders', icon: ClipboardList, roles: ['admin', 'gerente'] },
    { name: 'Gestão de Caixa', href: user?.role === 'admin' ? '/admin/cash-till' : '/gerente/cash-till', icon: DollarSign, roles: ['admin', 'gerente'] },
    { name: 'Vendas', href: user?.role === 'admin' ? '/admin/sales' : '/gerente/sales', icon: ShoppingCart, roles: ['admin', 'gerente'] },
    { name: 'Clientes', href: '/admin/clientes', icon: Users, roles: ['admin'] },
    { name: 'Produtos', href: user?.role === 'admin' ? '/admin/products' : '/gerente/products', icon: Package, roles: ['admin', 'gerente'] },
    { name: 'Estoque', href: user?.role === 'admin' ? '/admin/inventory' : '/gerente/inventory', icon: Archive, roles: ['admin', 'gerente'] },
    { name: 'Relatórios', href: user?.role === 'admin' ? '/admin/reports' : '/gerente/reports', icon: BarChart, roles: ['admin', 'gerente'] },
    { name: 'Gestão Financeira', href: '/admin/financeiro', icon: TrendingUp, roles: ['admin'] },
    { name: 'Lojas', href: '/admin/stores', icon: Store, roles: ['admin'] },
    { name: 'Vendedores', href: '/admin/sellers', icon: UserSquare, roles: ['admin'] },
    { name: 'Usuários', href: '/admin/users', icon: Users, roles: ['admin'] },
    { name: 'Categorias', href: '/admin/categories', icon: Tag, roles: ['admin'] },
  ];

  const filteredNavLinks = navLinks.filter(link => link.roles.includes(user?.role));
  
  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className={`bg-gray-800 text-gray-200 w-64 flex-shrink-0 absolute inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-30`}>
        <div className="flex items-center justify-center h-20 border-b border-gray-700">
          <Link to="/" className="flex items-center space-x-2">
            <Glasses className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">Óticas</span>
          </Link>
        </div>
        <nav className="mt-6">
          {filteredNavLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={() => sidebarOpen && setSidebarOpen(false)}
              className={`flex items-center py-2.5 px-4 my-1 rounded-md transition duration-200 ${
                isActive(link.href)
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-700 hover:text-white'
              }`}
            >
              <link.icon className="h-5 w-5 mr-3" />
              <span className="hidden sm:inline">{link.name}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between md:justify-end p-4 bg-white shadow-md z-10 sticky top-0 w-full">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 md:hidden"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 text-sm sm:text-base">
              Olá, {user?.first_name || user?.username}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center text-red-500 hover:text-red-700"
            >
              <LogOut className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-2 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout; 