import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CheckCircle, Info, XCircle } from 'lucide-react';
import api from '../../services/api';

const initialForm = {
    descricao: '',
    tipo: 'fornecedor',
    fornecedor: '',
    funcionario: '',
    valor: '',
    data_vencimento: '',
    observacoes: '',
};

const tipos = [
    { value: 'fornecedor', label: 'Fornecedor', sugestaoVenc: '05' },
    { value: 'funcionario', label: 'Funcionário', sugestaoVenc: '05' },
    { value: 'imposto', label: 'Imposto', sugestaoVenc: '20' },
    { value: 'servico', label: 'Serviço', sugestaoVenc: '10' },
    { value: 'aluguel', label: 'Aluguel', sugestaoVenc: '05' },
    { value: 'energia', label: 'Energia', sugestaoVenc: '10' },
    { value: 'agua', label: 'Água', sugestaoVenc: '10' },
    { value: 'internet', label: 'Internet', sugestaoVenc: '10' },
    { value: 'telefone', label: 'Telefone', sugestaoVenc: '10' },
    { value: 'manutencao', label: 'Manutenção', sugestaoVenc: '15' },
    { value: 'marketing', label: 'Marketing', sugestaoVenc: '15' },
    { value: 'outro', label: 'Outro', sugestaoVenc: '10' },
];

const statusLabels = {
    pendente: 'Pendente',
    pago: 'Pago',
    vencido: 'Vencido',
    cancelado: 'Cancelado',
};

const FinanceiroContasPagar = () => {
    const [contas, setContas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(initialForm);
    const [editId, setEditId] = useState(null);
    const [fornecedores, setFornecedores] = useState([]);
    const [funcionarios, setFuncionarios] = useState([]);
    const [filtros, setFiltros] = useState({
        status: '', tipo: '', fornecedor: '', funcionario: '', data_inicio: '', data_fim: '', busca: '',
    });
    const [isRecorrente, setIsRecorrente] = useState(false);
    const [dataFimRecorrencia, setDataFimRecorrencia] = useState('');
    const [feedback, setFeedback] = useState({ success: '', error: '' });
    const [salvarOutra, setSalvarOutra] = useState(false);
    const [erros, setErros] = useState({});

    useEffect(() => {
        fetchContas();
        fetchFornecedores();
        fetchFuncionarios();
    }, []);

    useEffect(() => {
        fetchContas();
    }, [filtros]);

    const fetchContas = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filtros.status) params.status = filtros.status;
            if (filtros.tipo) params.tipo = filtros.tipo;
            if (filtros.fornecedor) params.fornecedor = filtros.fornecedor;
            if (filtros.funcionario) params.funcionario = filtros.funcionario;
            if (filtros.data_inicio) params.data_vencimento_inicio = filtros.data_inicio;
            if (filtros.data_fim) params.data_vencimento_fim = filtros.data_fim;
            if (filtros.busca) params.search = filtros.busca;
            const res = await api.get('/api/contas-pagar/', { params });
            setContas(res.data);
        } catch (e) {
            setContas([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchFornecedores = async () => {
        try {
            const res = await api.get('/api/fornecedores/');
            setFornecedores(res.data);
        } catch (e) {
            setFornecedores([]);
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

    const handleTipoChange = (e) => {
        setForm({ ...form, tipo: e.target.value });
        // Sugestão automática de vencimento
        const tipoSel = tipos.find(t => t.value === e.target.value);
        if (tipoSel && !form.data_vencimento) {
            const hoje = new Date();
            const ano = hoje.getFullYear();
            const mes = (hoje.getMonth() + 1).toString().padStart(2, '0');
            const dia = tipoSel.sugestaoVenc;
            setForm(f => ({ ...f, data_vencimento: `${ano}-${mes}-${dia}` }));
        }
    };

    const handleFiltro = (e) => {
        setFiltros({ ...filtros, [e.target.name]: e.target.value });
    };

    const validar = () => {
        const err = {};
        if (!form.descricao) err.descricao = 'Informe a descrição.';
        if (!form.valor) err.valor = 'Informe o valor.';
        if (!form.data_vencimento) err.data_vencimento = 'Informe a data de vencimento.';
        if (isRecorrente && !dataFimRecorrencia) err.dataFimRecorrencia = 'Informe até quando a conta se repete.';
        setErros(err);
        return Object.keys(err).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeedback({ success: '', error: '' });
        if (!validar()) return;
        try {
            if (editId) {
                await api.put(`/api/contas-pagar/${editId}/`, form);
                setFeedback({ success: 'Conta atualizada com sucesso!', error: '' });
            } else {
                if (isRecorrente && dataFimRecorrencia && form.data_vencimento) {
                    const inicio = new Date(form.data_vencimento);
                    const fim = new Date(dataFimRecorrencia);
                    let atual = new Date(inicio);
                    while (atual <= fim) {
                        const conta = { ...form, data_vencimento: atual.toISOString().slice(0, 10) };
                        await api.post('/api/contas-pagar/', conta);
                        atual.setMonth(atual.getMonth() + 1);
                    }
                } else {
                    await api.post('/api/contas-pagar/', form);
                }
                setFeedback({ success: 'Conta cadastrada com sucesso!', error: '' });
            }
            if (salvarOutra) {
                setForm(initialForm);
                setIsRecorrente(false);
                setDataFimRecorrencia('');
                setEditId(null);
            } else {
                setShowForm(false);
                setForm(initialForm);
                setEditId(null);
                setIsRecorrente(false);
                setDataFimRecorrencia('');
            }
            fetchContas();
        } catch (e) {
            setFeedback({ success: '', error: 'Erro ao salvar conta.' });
        }
    };

    const handleEdit = (conta) => {
        setForm({
            descricao: conta.descricao,
            tipo: conta.tipo,
            fornecedor: conta.fornecedor || '',
            funcionario: conta.funcionario || '',
            valor: conta.valor,
            data_vencimento: conta.data_vencimento,
            observacoes: conta.observacoes || '',
        });
        setEditId(conta.id);
        setShowForm(true);
        setIsRecorrente(false);
        setDataFimRecorrencia('');
        setErros({});
    };

    const handleDelete = async (id) => {
        if (window.confirm('Deseja realmente excluir esta conta?')) {
            await api.delete(`/api/contas-pagar/${id}/`);
            fetchContas();
        }
    };

    const handleMarcarPago = async (id) => {
        await api.post(`/api/contas-pagar/${id}/marcar_pago/`);
        fetchContas();
    };

    const limparForm = () => {
        setForm(initialForm);
        setIsRecorrente(false);
        setDataFimRecorrencia('');
        setEditId(null);
        setErros({});
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Contas a Pagar</h2>
                <button
                    className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    onClick={() => { setShowForm(true); limparForm(); }}
                >
                    <Plus className="h-4 w-4 mr-2" /> Nova Conta
                </button>
            </div>

            {/* FILTROS AVANÇADOS */}
            <div className="bg-white p-4 rounded shadow mb-4 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs font-medium">Status</label>
                    <select name="status" value={filtros.status} onChange={handleFiltro} className="border rounded px-2 py-1">
                        <option value="">Todos</option>
                        <option value="pendente">Pendente</option>
                        <option value="pago">Pago</option>
                        <option value="vencido">Vencido</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium">Tipo</label>
                    <select name="tipo" value={filtros.tipo} onChange={handleFiltro} className="border rounded px-2 py-1">
                        <option value="">Todos</option>
                        {tipos.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium">Fornecedor</label>
                    <select name="fornecedor" value={filtros.fornecedor} onChange={handleFiltro} className="border rounded px-2 py-1">
                        <option value="">Todos</option>
                        {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium">Funcionário</label>
                    <select name="funcionario" value={filtros.funcionario} onChange={handleFiltro} className="border rounded px-2 py-1">
                        <option value="">Todos</option>
                        {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium">De</label>
                    <input type="date" name="data_inicio" value={filtros.data_inicio} onChange={handleFiltro} className="border rounded px-2 py-1" />
                </div>
                <div>
                    <label className="block text-xs font-medium">Até</label>
                    <input type="date" name="data_fim" value={filtros.data_fim} onChange={handleFiltro} className="border rounded px-2 py-1" />
                </div>
                <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-medium">Buscar</label>
                    <input type="text" name="busca" value={filtros.busca} onChange={handleFiltro} placeholder="Descrição, valor, etc" className="border rounded px-2 py-1 w-full" />
                </div>
                <button onClick={() => setFiltros({ status: '', tipo: '', fornecedor: '', funcionario: '', data_inicio: '', data_fim: '', busca: '' })} className="ml-2 px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 text-xs">Limpar</button>
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
                    <h3 className="text-lg font-semibold mb-4">Cadastro de Conta</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Dados principais */}
                        <div>
                            <label className="block text-sm font-medium">Descrição <span className="text-red-500">*</span></label>
                            <div className="flex items-center">
                                <input name="descricao" value={form.descricao} onChange={handleInput} required placeholder="Ex: Aluguel Loja Centro" className={`w-full border rounded px-2 py-1 ${erros.descricao ? 'border-red-400' : ''}`} />
                                <Info className="h-4 w-4 ml-2 text-gray-400" title="Dê um nome fácil de identificar para a conta." />
                            </div>
                            {erros.descricao && <span className="text-xs text-red-500">{erros.descricao}</span>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Tipo <span className="text-red-500">*</span></label>
                            <select name="tipo" value={form.tipo} onChange={handleTipoChange} className="w-full border rounded px-2 py-1">
                                {tipos.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Fornecedor</label>
                            <select name="fornecedor" value={form.fornecedor || ''} onChange={handleInput} className="w-full border rounded px-2 py-1">
                                <option value="">--</option>
                                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Funcionário</label>
                            <select name="funcionario" value={form.funcionario || ''} onChange={handleInput} className="w-full border rounded px-2 py-1">
                                <option value="">--</option>
                                {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Valor <span className="text-red-500">*</span></label>
                            <div className="flex items-center">
                                <input name="valor" value={form.valor} onChange={handleInput} type="number" step="0.01" required placeholder="Ex: 1200.00" className={`w-full border rounded px-2 py-1 ${erros.valor ? 'border-red-400' : ''}`} />
                                <Info className="h-4 w-4 ml-2 text-gray-400" title="Valor total da conta. Use ponto para centavos." />
                            </div>
                            {erros.valor && <span className="text-xs text-red-500">{erros.valor}</span>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Data de Vencimento <span className="text-red-500">*</span></label>
                            <div className="flex items-center">
                                <input name="data_vencimento" value={form.data_vencimento} onChange={handleInput} type="date" required className={`w-full border rounded px-2 py-1 ${erros.data_vencimento ? 'border-red-400' : ''}`} />
                                <Info className="h-4 w-4 ml-2 text-gray-400" title="Quando a conta deve ser paga?" />
                            </div>
                            {erros.data_vencimento && <span className="text-xs text-red-500">{erros.data_vencimento}</span>}
                        </div>
                        {/* Recorrência */}
                        <div className="md:col-span-2 flex items-center space-x-4 mt-2">
                            <input type="checkbox" id="recorrente" checked={isRecorrente} onChange={e => setIsRecorrente(e.target.checked)} />
                            <label htmlFor="recorrente" className="text-sm">Conta fixa/recorrente (repete todo mês)</label>
                            <Info className="h-4 w-4 text-gray-400" title="Se marcado, o sistema vai criar automaticamente as próximas parcelas todo mês até a data escolhida." />
                            {isRecorrente && (
                                <>
                                    <span className="text-xs ml-4">Até:</span>
                                    <input type="date" value={dataFimRecorrencia} onChange={e => { setDataFimRecorrencia(e.target.value); setErros({ ...erros, dataFimRecorrencia: '' }); }} className={`border rounded px-2 py-1 ${erros.dataFimRecorrencia ? 'border-red-400' : ''}`} />
                                    {erros.dataFimRecorrencia && <span className="text-xs text-red-500 ml-2">{erros.dataFimRecorrencia}</span>}
                                </>
                            )}
                        </div>
                        {/* Observações */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium">Observações</label>
                            <textarea name="observacoes" value={form.observacoes} onChange={handleInput} placeholder="Ex: Referente ao mês de junho, vencimento antecipado, etc." className="w-full border rounded px-2 py-1" />
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
                                <th className="px-2 py-2">Descrição</th>
                                <th className="px-2 py-2">Tipo</th>
                                <th className="px-2 py-2">Fornecedor</th>
                                <th className="px-2 py-2">Funcionário</th>
                                <th className="px-2 py-2">Valor</th>
                                <th className="px-2 py-2">Vencimento</th>
                                <th className="px-2 py-2">Status</th>
                                <th className="px-2 py-2">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contas.map(conta => (
                                <tr key={conta.id} className="border-t">
                                    <td className="px-2 py-2">{conta.descricao}</td>
                                    <td className="px-2 py-2">{tipos.find(t => t.value === conta.tipo)?.label}</td>
                                    <td className="px-2 py-2">{conta.fornecedor_nome || '-'}</td>
                                    <td className="px-2 py-2">{conta.funcionario_nome || '-'}</td>
                                    <td className="px-2 py-2">R$ {Number(conta.valor).toFixed(2)}</td>
                                    <td className="px-2 py-2">{conta.data_vencimento}</td>
                                    <td className="px-2 py-2">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${conta.status === 'pago' ? 'bg-green-100 text-green-700' : conta.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{statusLabels[conta.status]}</span>
                                    </td>
                                    <td className="px-2 py-2 flex space-x-2">
                                        <button title="Editar" onClick={() => handleEdit(conta)} className="text-blue-600 hover:text-blue-800"><Edit className="h-4 w-4" /></button>
                                        <button title="Excluir" onClick={() => handleDelete(conta.id)} className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button>
                                        {conta.status !== 'pago' && (
                                            <button title="Marcar como Pago" onClick={() => handleMarcarPago(conta.id)} className="text-green-600 hover:text-green-800"><CheckCircle className="h-4 w-4" /></button>
                                        )}
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

export default FinanceiroContasPagar; 