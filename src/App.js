import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CashTillProvider } from './contexts/CashTillContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Stores from './pages/admin/Stores';
import Products from './pages/admin/Products';
import Categories from './pages/admin/Categories';
import Inventory from './pages/admin/Inventory';
import Sales from './pages/admin/Sales';
import Reports from './pages/admin/Reports';
import Sellers from './pages/admin/Sellers';
import CashTill from './pages/admin/CashTill';
import GerenteDashboard from './pages/gerente/Dashboard';
import AdminSellers from './pages/admin/Sellers';
import AdminUsers from './pages/admin/Users';
import AdminOrders from './pages/admin/Orders';
import GerenteOrders from './pages/gerente/Orders';
import Clientes from './pages/admin/Clientes';
import ClientePerfil from './pages/admin/ClientePerfil';
import Financeiro from './pages/admin/Financeiro';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Login />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <div>Acesso negado.</div>;
  }

  return children;
};

function App() {
  return (
    <Router basename="/otica2">
      <AuthProvider>
        <CashTillProvider>
          <AppRoutes />
        </CashTillProvider>
      </AuthProvider>
    </Router>
  );
}

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route 
        path="/admin/*"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <Layout>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="stores" element={<Stores />} />
                <Route path="products" element={<Products />} />
                <Route path="categories" element={<Categories />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="sales" element={<Sales />} />
                <Route path="clientes" element={<Clientes />} />
                <Route path="cliente/:id" element={<ClientePerfil />} />
                <Route path="sellers" element={<AdminSellers />} />
                <Route path="reports" element={<Reports />} />
                <Route path="cash-till" element={<CashTill />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="financeiro" element={<Financeiro />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />

      <Route
        path="/gerente/*"
        element={
          <PrivateRoute allowedRoles={['gerente']}>
            <Layout>
              <Routes>
                <Route path="dashboard" element={<GerenteDashboard />} />
                <Route path="orders" element={<GerenteOrders />} />
                <Route path="products" element={<Products />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="sales" element={<Sales />} />
                <Route path="cash-till" element={<CashTill />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />

      <Route path="/" element={<Login />} />
    </Routes>
  );
};

export default App; 