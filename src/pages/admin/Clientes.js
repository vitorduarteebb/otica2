import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';

const initialForm = {
  nome: '',
  email: '',
  telefone: '',
  cpf: '',
  data_nascimento: '',
  sexo: '',
  endereco: '',
  numero: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  observacoes: '',
};

const sexos = [
  { value: '', label: 'Selecione' },
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' },
  { value: 'O', label: 'Outro' },
];

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/clientes/');
      setClientes(res.data.results || res.data);
    } catch (e) {
      setClientes([]);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/api/clientes/${editing.id}/`, form);
      } else {
        await api.post('/api/clientes/', form);
      }
      setShowForm(false);
      setEditing(null);
      setForm(initialForm);
      fetchClientes();
    } catch (err) {
      alert('Erro ao salvar cliente.');
    }
  };

  const handleEdit = (cliente) => {
    setEditing(cliente);
    setForm({ ...cliente, data_nascimento: cliente.data_nascimento || '' });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja excluir este cliente?')) {
      await api.delete(`/api/clientes/${id}/`);
      fetchClientes();
    }
  };

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    (c.cpf && c.cpf.includes(search)) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm(initialForm); }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Novo Cliente
        </button>
      </div>
      <div className="mb-4 flex items-center">
        <input
          type="text"
          placeholder="Buscar por nome, CPF ou email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md w-80 mr-2"
        />
        <span className="text-gray-500">{filtered.length} clientes encontrados</span>
      </div>
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">{editing ? 'Editar Cliente' : 'Novo Cliente'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input type="text" required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
              <input type="text" value={form.cpf} onChange={e => setForm({ ...form, cpf: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input type="text" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
              <input type="date" value={form.data_nascimento || ''} onChange={e => setForm({ ...form, data_nascimento: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
              <select value={form.sexo} onChange={e => setForm({ ...form, sexo: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                {sexos.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
              <input type="text" value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
              <input type="text" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
              <input type="text" value={form.bairro} onChange={e => setForm({ ...form, bairro: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input type="text" value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <input type="text" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
              <input type="text" value={form.cep} onChange={e => setForm({ ...form, cep: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div className="md:col-span-2 flex gap-2 mt-2">
              <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">Salvar</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); setForm(initialForm); }} className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg">Cancelar</button>
            </div>
          </form>
        </div>
      )}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">CPF</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">E-mail</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cidade</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-4">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-4">Nenhum cliente encontrado.</td></tr>
            ) : filtered.map(cliente => (
              <tr key={cliente.id}>
                <td className="px-4 py-2">{cliente.nome}</td>
                <td className="px-4 py-2">{cliente.cpf}</td>
                <td className="px-4 py-2">{cliente.telefone}</td>
                <td className="px-4 py-2">{cliente.email}</td>
                <td className="px-4 py-2">{cliente.cidade}</td>
                <td className="px-4 py-2 flex flex-col sm:flex-row gap-2">
                  <Link to={`/admin/cliente/${cliente.id}`} className="text-green-600 hover:underline">Ver perfil</Link>
                  <button onClick={() => handleEdit(cliente)} className="text-blue-600 hover:underline">Editar</button>
                  <button onClick={() => handleDelete(cliente.id)} className="text-red-600 hover:underline">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 