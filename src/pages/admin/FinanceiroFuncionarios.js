import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CheckCircle, Info, XCircle } from 'lucide-react';
import api from '../../services/api';

const initialForm = {
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    cargo: 'vendedor',
    data_admissao: '',
    salario_base: '',
    comissao_percentual: '',
    ativo: true,
    observacoes: '',
};

const cargos = [
    { value: 'vendedor', label: 'Vendedor' },
    { value: 'gerente', label: 'Gerente' },
    { value: 'optico', label: 'Óptico' },
    { value: 'auxiliar', label: 'Auxiliar' },
    { value: 'administrativo', label: 'Administrativo' },
    { value: 'limpeza', label: 'Limpeza' },
    { value: 'seguranca', label: 'Segurança' },
    { value: 'outro', label: 'Outro' },
];

const FinanceiroFuncionarios = () => {
    const [funcionarios, setFuncionarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(initialForm);
    const [editId, setEditId] = useState(null);
    const [filtros, setFiltros] = useState({ cargo: '', ativo: '', busca: '' });
    const [feedback, setFeedback] = useState({ success: '', error: '' });
    const [salvarOutra, setSalvarOutra] = useState(false);
    const [erros, setErros] = useState({});

    useEffect(() => {
        fetchFuncionarios();
    }, []);

    useEffect(() => {
        fetchFuncionarios();
    }, [filtros]);

    const fetchFuncionarios = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filtros.cargo) params.cargo = filtros.cargo;
            if (filtros.ativo) params.ativo = filtros.ativo;
            if (filtros.busca) params.search = filtros.busca;
            const res = await api.get('/api/funcionarios/', { params });
            setFuncionarios(res.data);
        } catch (e) {
            setFuncionarios([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInput = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
        setErros({ ...erros, [name]: '' });
    };

    const handleFiltro = (e) => {
        setFiltros({ ...filtros, [e.target.name]: e.target.value });
    };

    const validar = () => {
        const err = {};
        if (!form.nome) err.nome = 'Informe o nome.';
        if (!form.cpf) err.cpf = 'Informe o CPF.';
        if (!form.cargo) err.cargo = 'Informe o cargo.';
        if (!form.data_admissao) err.data_admissao = 'Informe a data de admissão.';
        if (!form.salario_base) err.salario_base = 'Informe o salário base.';
        setErros(err);
        return Object.keys(err).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeedback({ success: '', error: '' });
        if (!validar()) return;
        try {
            if (editId) {
                await api.put(`/api/funcionarios/${editId}/`, form);
                setFeedback({ success: 'Funcionário atualizado com sucesso!', error: '' });
            } else {
                await api.post('/api/funcionarios/', form);
                setFeedback({ success: 'Funcionário cadastrado com sucesso!', error: '' });
            }
            if (salvarOutra) {
                setForm(initialForm);
                setEditId(null);
            } else {
                setShowForm(false);
                setForm(initialForm);
                setEditId(null);
            }
            fetchFuncionarios();
        } catch (e) {
            setFeedback({ success: '', error: 'Erro ao salvar funcionário.' });
        }
    };

    const handleEdit = (f) => {
        setForm({
            nome: f.nome,
            cpf: f.cpf,
            email: f.email,
            telefone: f.telefone,
            cargo: f.cargo,
            data_admissao: f.data_admissao,
            salario_base: f.salario_base,
            comissao_percentual: f.comissao_percentual,
            ativo: f.ativo,
            observacoes: f.observacoes || '',
        });
        setEditId(f.id);
        setShowForm(true);
        setErros({});
    };

    const handleDelete = async (id) => {
        if (window.confirm('Deseja realmente excluir este funcionário?')) {
            await api.delete(`/api/funcionarios/${id}/`);
            fetchFuncionarios();
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
                <h2 className="text-xl font-bold">Funcionários</h2>
                <button
                    className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    onClick={() => { setShowForm(true); limparForm(); }}
                >
                    <Plus className="h-4 w-4 mr-2" /> Novo Funcionário
                </button>
            </div>

            {/* FILTROS */}
            <div className="bg-white p-4 rounded shadow mb-4 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs font-medium">Cargo</label>
                    <select name="cargo" value={filtros.cargo} onChange={handleFiltro} className="border rounded px-2 py-1">
                        <option value="">Todos</option>
                        {cargos.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium">Ativo</label>
                    <select name="ativo" value={filtros.ativo} onChange={handleFiltro} className="border rounded px-2 py-1">
                        <option value="">Todos</option>
                        <option value="true">Sim</option>
                        <option value="false">Não</option>
                    </select>
                </div>
                <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-medium">Buscar</label>
                    <input type="text" name="busca" value={filtros.busca} onChange={handleFiltro} placeholder="Nome, CPF, e-mail..." className="border rounded px-2 py-1 w-full" />
                </div>
                <button onClick={() => setFiltros({ cargo: '', ativo: '', busca: '' })} className="ml-2 px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 text-xs">Limpar</button>
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
                    <h3 className="text-lg font-semibold mb-4">Cadastro de Funcionário</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Nome <span className="text-red-500">*</span></label>
                            <div className="flex items-center">
                                <input name="nome" value={form.nome} onChange={handleInput} required placeholder="Nome completo" className={`w-full border rounded px-2 py-1 ${erros.nome ? 'border-red-400' : ''}`} />
                                <Info className="h-4 w-4 ml-2 text-gray-400" title="Nome completo do funcionário." />
                            </div>
                            {erros.nome && <span className="text-xs text-red-500">{erros.nome}</span>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium">CPF <span className="text-red-500">*</span></label>
                            <input name="cpf" value={form.cpf} onChange={handleInput} required placeholder="000.000.000-00" className={`w-full border rounded px-2 py-1 ${erros.cpf ? 'border-red-400' : ''}`} />
                            {erros.cpf && <span className="text-xs text-red-500">{erros.cpf}</span>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium">E-mail</label>
                            <input name="email" value={form.email} onChange={handleInput} placeholder="email@exemplo.com" className="w-full border rounded px-2 py-1" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Telefone</label>
                            <input name="telefone" value={form.telefone} onChange={handleInput} placeholder="(99) 99999-9999" className="w-full border rounded px-2 py-1" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Cargo <span className="text-red-500">*</span></label>
                            <select name="cargo" value={form.cargo} onChange={handleInput} className={`w-full border rounded px-2 py-1 ${erros.cargo ? 'border-red-400' : ''}`}>
                                {cargos.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                            {erros.cargo && <span className="text-xs text-red-500">{erros.cargo}</span>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Data de Admissão <span className="text-red-500">*</span></label>
                            <input name="data_admissao" value={form.data_admissao} onChange={handleInput} type="date" required className={`w-full border rounded px-2 py-1 ${erros.data_admissao ? 'border-red-400' : ''}`} />
                            {erros.data_admissao && <span className="text-xs text-red-500">{erros.data_admissao}</span>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Salário Base <span className="text-red-500">*</span></label>
                            <input name="salario_base" value={form.salario_base} onChange={handleInput} type="number" step="0.01" required placeholder="Ex: 2000.00" className={`w-full border rounded px-2 py-1 ${erros.salario_base ? 'border-red-400' : ''}`} />
                            {erros.salario_base && <span className="text-xs text-red-500">{erros.salario_base}</span>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Comissão (%)</label>
                            <input name="comissao_percentual" value={form.comissao_percentual} onChange={handleInput} type="number" step="0.01" placeholder="Ex: 2.5" className="w-full border rounded px-2 py-1" />
                        </div>
                        <div className="flex items-center mt-2">
                            <input type="checkbox" id="ativo" name="ativo" checked={form.ativo} onChange={handleInput} />
                            <label htmlFor="ativo" className="ml-2 text-sm">Ativo</label>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium">Observações</label>
                            <textarea name="observacoes" value={form.observacoes} onChange={handleInput} placeholder="Observações, histórico, etc." className="w-full border rounded px-2 py-1" />
                        </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2">
                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Salvar</button>
                        <button type="button" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onClick={() => { setSalvarOutra(true); }}>Salvar e cadastrar outro</button>
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
                                <th className="px-2 py-2">CPF</th>
                                <th className="px-2 py-2">Cargo</th>
                                <th className="px-2 py-2">Salário</th>
                                <th className="px-2 py-2">Comissão (%)</th>
                                <th className="px-2 py-2">Ativo</th>
                                <th className="px-2 py-2">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {funcionarios.map(f => (
                                <tr key={f.id} className="border-t">
                                    <td className="px-2 py-2">{f.nome}</td>
                                    <td className="px-2 py-2">{f.cpf}</td>
                                    <td className="px-2 py-2">{cargos.find(c => c.value === f.cargo)?.label}</td>
                                    <td className="px-2 py-2">R$ {Number(f.salario_base).toFixed(2)}</td>
                                    <td className="px-2 py-2">{f.comissao_percentual || '-'}</td>
                                    <td className="px-2 py-2">{f.ativo ? 'Sim' : 'Não'}</td>
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

export default FinanceiroFuncionarios; 