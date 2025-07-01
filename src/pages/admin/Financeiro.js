import React, { useState, useEffect } from 'react';
import { 
    DollarSign, 
    Users, 
    FileText, 
    TrendingUp, 
    Calendar,
    CreditCard,
    UserCheck,
    Building,
    BarChart3,
    Plus,
    Eye,
    AlertTriangle
} from 'lucide-react';
import api from '../../services/api';
import FinanceiroContasPagar from './FinanceiroContasPagar';
import FinanceiroContasReceber from './FinanceiroContasReceber';

const Financeiro = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [resumoContas, setResumoContas] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        fetchDashboardData();
        fetchResumoContas();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/api/financeiro/dashboard/');
            setDashboardData(response.data);
        } catch (error) {
            console.error('Erro ao carregar dashboard financeiro:', error);
        }
    };

    const fetchResumoContas = async () => {
        try {
            const response = await api.get('/api/financeiro/resumo-contas/');
            setResumoContas(response.data);
        } catch (error) {
            console.error('Erro ao carregar resumo de contas:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    };

    const tabs = [
        { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
        { id: 'contas-pagar', name: 'Contas a Pagar', icon: CreditCard },
        { id: 'contas-receber', name: 'Contas a Receber', icon: DollarSign },
        { id: 'funcionarios', name: 'Funcionarios', icon: Users },
        { id: 'fornecedores', name: 'Fornecedores', icon: Building },
        { id: 'folha-pagamento', name: 'Folha de Pagamento', icon: FileText },
        { id: 'relatorios', name: 'Relatorios', icon: TrendingUp },
    ];

    const renderDashboard = () => (
        <div className="space-y-6">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Receitas do Mes</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(dashboardData?.total_receitas)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <CreditCard className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Despesas do Mes</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(dashboardData?.total_despesas)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Lucro Bruto</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(dashboardData?.lucro_bruto)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <BarChart3 className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Margem de Lucro</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {dashboardData?.margem_lucro?.toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alertas e Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas</h3>
                    <div className="space-y-3">
                        {dashboardData?.contas_pagar_vencidas > 0 && (
                            <div className="flex items-center p-3 bg-red-50 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-red-800">
                                        {dashboardData.contas_pagar_vencidas} conta(s) a pagar vencida(s)
                                    </p>
                                </div>
                            </div>
                        )}
                        {dashboardData?.contas_receber_vencidas > 0 && (
                            <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-yellow-800">
                                        {dashboardData.contas_receber_vencidas} conta(s) a receber vencida(s)
                                    </p>
                                </div>
                            </div>
                        )}
                        {(!dashboardData?.contas_pagar_vencidas && !dashboardData?.contas_receber_vencidas) && (
                            <div className="flex items-center p-3 bg-green-50 rounded-lg">
                                <Eye className="h-5 w-5 text-green-600 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-green-800">
                                        Todas as contas estao em dia
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo de Contas</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Contas a Pagar Pendentes:</span>
                            <span className="font-medium text-red-600">
                                {formatCurrency(resumoContas?.contas_pagar_pendentes)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Contas a Pagar Vencidas:</span>
                            <span className="font-medium text-red-600">
                                {formatCurrency(resumoContas?.contas_pagar_vencidas)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Contas a Receber Pendentes:</span>
                            <span className="font-medium text-green-600">
                                {formatCurrency(resumoContas?.contas_receber_pendentes)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Contas a Receber Vencidas:</span>
                            <span className="font-medium text-yellow-600">
                                {formatCurrency(resumoContas?.contas_receber_vencidas)}
                            </span>
                        </div>
                        <hr />
                        <div className="flex justify-between items-center font-semibold">
                            <span className="text-gray-900">Total a Pagar:</span>
                            <span className="text-red-600">
                                {formatCurrency(resumoContas?.total_pagar)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center font-semibold">
                            <span className="text-gray-900">Total a Receber:</span>
                            <span className="text-green-600">
                                {formatCurrency(resumoContas?.total_receber)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Estatisticas Adicionais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Funcionarios Ativos</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {dashboardData?.total_funcionarios || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <FileText className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Folha do Mes</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(dashboardData?.folha_pagamento_mes)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Building className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Fornecedores Ativos</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {dashboardData?.fornecedores_ativos || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Gestao Financeira</h1>
                <p className="text-gray-600 mt-2">Gerencie contas, funcionarios, fornecedores e relatorios financeiros</p>
            </div>

            {/* Navegacao por Abas */}
            <div className="mb-6">
                <nav className="flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{tab.name}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Conteudo das Abas */}
            <div className="bg-gray-50 rounded-lg p-6">
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'contas-pagar' && (
                    <FinanceiroContasPagar />
                )}
                {activeTab === 'contas-receber' && (
                    <FinanceiroContasReceber />
                )}
                {activeTab === 'funcionarios' && (
                    <div className="text-center py-12">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Funcionarios</h3>
                        <p className="text-gray-600">Funcionalidade em desenvolvimento</p>
                    </div>
                )}
                {activeTab === 'fornecedores' && (
                    <div className="text-center py-12">
                        <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Fornecedores</h3>
                        <p className="text-gray-600">Funcionalidade em desenvolvimento</p>
                    </div>
                )}
                {activeTab === 'folha-pagamento' && (
                    <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Folha de Pagamento</h3>
                        <p className="text-gray-600">Funcionalidade em desenvolvimento</p>
                    </div>
                )}
                {activeTab === 'relatorios' && (
                    <div className="text-center py-12">
                        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Relatorios</h3>
                        <p className="text-gray-600">Funcionalidade em desenvolvimento</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Financeiro; 