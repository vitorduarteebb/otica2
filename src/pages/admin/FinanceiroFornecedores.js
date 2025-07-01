import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CheckCircle, Info, XCircle } from 'lucide-react';
import api from '../../services/api';

const initialForm = {
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    observacoes: '',
};

const FinanceiroFornecedores = () => {
    const [fornecedores, setFornecedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(initialForm);
    const [editId, setEditId] = useState(null);
    const [filtros, setFiltros] = useState({ busca: '' });
    const [feedback, setFeedback] = useState({ success: '', error: '' });
    const [salvarOutro, setSalvarOutro] = useState(false);
    const [erros, setErros] = useState({});

    useEffect(() => {
        fetchFornecedores();
    }, []);

    useEffect(() => {
        fetchFornecedores();
    }, [filtros]);

    const fetchFornecedores = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filtros.busca) params.search = filtros.busca;
            const res = await api.get('/api/fornecedores/', { params });
            setFornecedores(res.data);
        } catch (e) {
            setFornecedores([]);
        } finally {
            setLoading(false);
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
        if (!form.nome) err.nome = 'Informe o nome.';
        if (!form.cnpj) err.cnpj = 'Informe o CNPJ.';
        setErros(err);
        return Object.keys(err).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeedback({ success: '', error: '' });
        if (!validar()) return;
        try {
            if (editId) {
                await api.put(`/api/fornecedores/${editId}/`, form);
                setFeedback({ success: 'Fornecedor atualizado com sucesso!', error: '' });
            } else {
                await api.post('/api/fornecedores/', form);
                setFeedback({ success: 'Fornecedor cadastrado com sucesso!', error: '' });
            }
            if (salvarOutro) {
                setForm(initialForm);
                setEditId(null);
            } else {
                setShowForm(false);
                setForm(initialForm);
                setEditId(null);
            }
            fetchFornecedores();
        } catch (e) {
            setFeedback({ success: '', error: 'Erro ao salvar fornecedor.' });
        }
    };

    const handleEdit = (f) => {
        setForm({
            nome: f.nome,
            cnpj: f.cnpj,
            email: f.email,
            telefone: f.telefone,
            endereco: f.endereco,
            observacoes: f.observacoes || '',
        });
        setEditId(f.id);
        setShowForm(true);
        setErros({});
    };

    const handleDelete = async (id) => {
        if (window.confirm('Deseja realmente excluir este fornecedor?')) {
            await api.delete(`/api/fornecedores/${id}/`);
            fetchFornecedores();
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
                <h2 className="text-xl font-bold">Fornecedores</h2>
                <button
                    className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    onClick={() => { setShowForm(true); limparForm(); }}
                >
                    <Plus className="h-4 w-4 mr-2" /> Novo Fornecedor
                </button>
            </div>

            {/* FILTROS */}
            <div className="bg-white p-4 rounded shadow mb-4 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-medium">Buscar</label>
                    <input type="text" name="busca" value={filtros.busca} onChange={handleFiltro} placeholder="Nome, CNPJ, e-mail..." className="border rounded px-2 py-1 w-full" />
                </div>
                <button onClick={() => setFiltros({ busca: '' })} className="ml-2 px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 text-xs">Limpar</button>
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
                    <h3 className="text-lg font-semibold mb-4">Cadastro de Fornecedor</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Nome <span className="text-red-500">*</span></label>
                            <div className="flex items-center">
                                <input name="nome" value={form.nome} onChange={handleInput} required placeholder="Nome fantasia ou razão social" className={`w-full border rounded px-2 py-1 ${erros.nome ? 'border-red-400' : ''}`} />
                                <Info className="h-4 w-4 ml-2 text-gray-400" title="Nome fantasia ou razão social do fornecedor." />
                            </div>
                            {erros.nome && <span className="text-xs text-red-500">{erros.nome}</span>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium">CNPJ <span className="text-red-500">*</span></label>
                            <input name="cnpj" value={form.cnpj} onChange={handleInput} required placeholder="00.000.000/0001-00" className={`w-full border rounded px-2 py-1 ${erros.cnpj ? 'border-red-400' : ''}`} />
                            {erros.cnpj && <span className="text-xs text-red-500">{erros.cnpj}</span>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium">E-mail</label>
                            <input name="email" value={form.email} onChange={handleInput} placeholder="email@exemplo.com" className="w-full border rounded px-2 py-1" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Telefone</label>
                            <input name="telefone" value={form.telefone} onChange={handleInput} placeholder="(99) 99999-9999" className="w-full border rounded px-2 py-1" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium">Endereço</label>
                            <input name="endereco" value={form.endereco} onChange={handleInput} placeholder="Rua, número, bairro, cidade..." className="w-full border rounded px-2 py-1" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium">Observações</label>
                            <textarea name="observacoes" value={form.observacoes} onChange={handleInput} placeholder="Observações, histórico, etc." className="w-full border rounded px-2 py-1" />
                        </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2">
                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Salvar</button>
                        <button type="button" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onClick={() => { setSalvarOutro(true); }}>Salvar e cadastrar outro</button>
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
                                <th className="px-2 py-2">Nome</th>
                                <th className="px-2 py-2">CNPJ</th>
                                <th className="px-2 py-2">E-mail</th>
                                <th className="px-2 py-2">Telefone</th>
                                <th className="px-2 py-2">Endereço</th>
                                <th className="px-2 py-2">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fornecedores.map(f => (
                                <tr key={f.id} className="border-t">
                                    <td className="px-2 py-2">{f.nome}</td>
                                    <td className="px-2 py-2">{f.cnpj}</td>
                                    <td className="px-2 py-2">{f.email || '-'}</td>
                                    <td className="px-2 py-2">{f.telefone || '-'}</td>
                                    <td className="px-2 py-2">{f.endereco || '-'}</td>
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

export default FinanceiroFornecedores; 