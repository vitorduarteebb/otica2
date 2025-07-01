import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CheckCircle, Info, XCircle } from 'lucide-react';
import api from '../../services/api';

const initialForm = {
    funcionario: '',
    mes_referencia: '',
    salario: '',
    comissao: '',
    descontos: '',
    total: '',
    observacoes: '',
};

const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const FinanceiroFolhaPagamento = () => {
    const [folhas, setFolhas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(initialForm);
    const [editId, setEditId] = useState(null);
    const [funcionarios, setFuncionarios] = useState([]);
    const [filtros, setFiltros] = useState({ funcionario: '', mes: '', busca: '' });
    const [feedback, setFeedback] = useState({ success: '', error: '' });
    const [salvarOutra, setSalvarOutra] = useState(false);
    const [erros, setErros] = useState({});

    useEffect(() => {
        fetchFolhas();
        fetchFuncionarios();
    }, []);

    useEffect(() => {
        fetchFolhas();
    }, [filtros]);

    const fetchFolhas = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filtros.funcionario) params.funcionario = filtros.funcionario;
            if (filtros.mes) params.mes_referencia = filtros.mes;
            if (filtros.busca) params.search = filtros.busca;
            const res = await api.get('/api/folha-pagamento/', { params });
            setFolhas(res.data);
        } catch (e) {
            setFolhas([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchFuncionarios = async () => {
        try {
            const res = await api.get('/api/funcionarios/');
            setFuncionarios(res.data);
        } catch (e) {
            setFuncionarios([]);
        }
    };

    const handleInput = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErros({ ...erros, [e.target.name]: '' });
    };

    const handleFiltro = (e) => {
        setFiltros({ ...filtros, [e.target.name]: e.target.value });
    };

    const validar = () => {
        const err = {};
        if (!form.funcionario) err.funcionario = 'Selecione o funcionário.';
        if (!form.mes_referencia) err.mes_referencia = 'Informe o mês de referência.';
        if (!form.salario) err.salario = 'Informe o salário.';
        setErros(err);
        return Object.keys(err).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeedback({ success: '', error: '' });
        if (!validar()) return;
        try {
            if (editId) {
                await api.put(`/api/folha-pagamento/${editId}/`, form);
                setFeedback({ success: 'Folha atualizada com sucesso!', error: '' });
            } else {
                await api.post('/api/folha-pagamento/', form);
                setFeedback({ success: 'Folha cadastrada com sucesso!', error: '' });
            }
            if (salvarOutra) {
                setForm(initialForm);
                setEditId(null);
            } else {
                setShowForm(false);
                setForm(initialForm);
                setEditId(null);
            }
            fetchFolhas();
        } catch (e) {
            setFeedback({ success: '', error: 'Erro ao salvar folha.' });
        }
    };

    const handleEdit = (f) => {
        setForm({
            funcionario: f.funcionario,
            mes_referencia: f.mes_referencia,
            salario: f.salario,
            comissao: f.comissao,
            descontos: f.descontos,
            total: f.total,
            observacoes: f.observacoes || '',
        });
        setEditId(f.id);
        setShowForm(true);
        setErros({});
    };

    const handleDelete = async (id) => {
        if (window.confirm('Deseja realmente excluir esta folha?')) {
            await api.delete(`/api/folha-pagamento/${id}/`);
            fetchFolhas();
        }
    };

    const limparForm = () => {
        setForm(initialForm);
        setEditId(null);
        setErros({});
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Folha de Pagamento</h2>
                <button
                    className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    onClick={() => { setShowForm(true); limparForm(); }}
                >
                    <Plus className="h-4 w-4 mr-2" /> Nova Folha
                </button>
            </div>

            {/* FILTROS */}
            <div className="bg-white p-4 rounded shadow mb-4 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs font-medium">Funcionário</label>
                    <select name="funcionario" value={filtros.funcionario} onChange={handleFiltro} className="border rounded px-2 py-1">
                        <option value="">Todos</option>
                        {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium">Mês</label>
                    <select name="mes" value={filtros.mes} onChange={handleFiltro} className="border rounded px-2 py-1">
                        <option value="">Todos</option>
                        {meses.map((m, i) => <option key={i} value={m}>{m}</option>)}
                    </select>
                </div>
                <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-medium">Buscar</label>
                    <input type="text" name="busca" value={filtros.busca} onChange={handleFiltro} placeholder="Funcionário, mês, valor..." className="border rounded px-2 py-1 w-full" />
                </div>
                <button onClick={() => setFiltros({ funcionario: '', mes: '', busca: '' })} className="ml-2 px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 text-xs">Limpar</button>
            </div>

            {/* FEEDBACK */}
            {feedback.success && (
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded mb-2 flex items-center"><CheckCircle className="h-4 w-4 mr-2" /> {feedback.success}</div>
            )}
            {feedback.error && (
                <div className="bg-red-100 text-red-800 px-4 py-2 rounded mb-2 flex items-center"><XCircle className="h-4 w-4 mr-2" /> {feedback.error}</div>
            )}

            {showForm && (
                <form className="bg-white p-6 rounded shadow mb-6" onSubmit={handleSubmit}>
                    <h3 className="text-lg font-semibold mb-4">Cadastro de Folha de Pagamento</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Funcionário <span className="text-red-500">*</span></label>
                            <select name="funcionario" value={form.funcionario} onChange={handleInput} className={`w-full border rounded px-2 py-1 ${erros.funcionario ? 'border-red-400' : ''}`}>
                                <option value="">Selecione</option>
                                {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                            </select>
                            {erros.funcionario && <span className="text-xs text-red-500">{erros.funcionario}</span>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Mês de Referência <span className="text-red-500">*</span></label>
                            <select name="mes_referencia" value={form.mes_referencia} onChange={handleInput} className={`w-full border rounded px-2 py-1 ${erros.mes_referencia ? 'border-red-400' : ''}`}>
                                <option value="">Selecione</option>
                                {meses.map((m, i) => <option key={i} value={m}>{m}</option>)}
                            </select>
                            {erros.mes_referencia && <span className="text-xs text-red-500">{erros.mes_referencia}</span>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Salário <span className="text-red-500">*</span></label>
                            <input name="salario" value={form.salario} onChange={handleInput} type="number" step="0.01" required placeholder="Ex: 2000.00" className={`w-full border rounded px-2 py-1 ${erros.salario ? 'border-red-400' : ''}`} />
                            {erros.salario && <span className="text-xs text-red-500">{erros.salario}</span>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Comissão</label>
                            <input name="comissao" value={form.comissao} onChange={handleInput} type="number" step="0.01" placeholder="Ex: 150.00" className="w-full border rounded px-2 py-1" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Descontos</label>
                            <input name="descontos" value={form.descontos} onChange={handleInput} type="number" step="0.01" placeholder="Ex: 50.00" className="w-full border rounded px-2 py-1" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Total Líquido</label>
                            <input name="total" value={form.total} onChange={handleInput} type="number" step="0.01" placeholder="Ex: 2100.00" className="w-full border rounded px-2 py-1" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium">Observações</label>
                            <textarea name="observacoes" value={form.observacoes} onChange={handleInput} placeholder="Observações, histórico, etc." className="w-full border rounded px-2 py-1" />
                        </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2">
                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Salvar</button>
                        <button type="button" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onClick={() => { setSalvarOutra(true); }}>Salvar e cadastrar outra</button>
                        <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={() => { setShowForm(false); limparForm(); }}>Cancelar</button>
                        <button type="button" className="bg-gray-200 px-4 py-2 rounded" onClick={limparForm}>Limpar</button>
                    </div>
                </form>
            )}

            {loading ? (
                <div>Carregando...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded shadow">
                        <thead>
                            <tr>
                                <th className="px-2 py-2">Funcionário</th>
                                <th className="px-2 py-2">Mês</th>
                                <th className="px-2 py-2">Salário</th>
                                <th className="px-2 py-2">Comissão</th>
                                <th className="px-2 py-2">Descontos</th>
                                <th className="px-2 py-2">Total Líquido</th>
                                <th className="px-2 py-2">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {folhas.map(f => (
                                <tr key={f.id} className="border-t">
                                    <td className="px-2 py-2">{f.funcionario_nome || '-'}</td>
                                    <td className="px-2 py-2">{f.mes_referencia}</td>
                                    <td className="px-2 py-2">R$ {Number(f.salario).toFixed(2)}</td>
                                    <td className="px-2 py-2">R$ {Number(f.comissao || 0).toFixed(2)}</td>
                                    <td className="px-2 py-2">R$ {Number(f.descontos || 0).toFixed(2)}</td>
                                    <td className="px-2 py-2">R$ {Number(f.total || 0).toFixed(2)}</td>
                                    <td className="px-2 py-2 flex space-x-2">
                                        <button title="Editar" onClick={() => handleEdit(f)} className="text-blue-600 hover:text-blue-800"><Edit className="h-4 w-4" /></button>
                                        <button title="Excluir" onClick={() => handleDelete(f.id)} className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default FinanceiroFolhaPagamento; 