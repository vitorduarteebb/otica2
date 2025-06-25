import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function ClientePerfil() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOptical, setEditOptical] = useState(false);
  const [opticalForm, setOpticalForm] = useState({
    grau_od: '', grau_oe: '', dnp_od: '', dnp_oe: '', adicao: '', observacoes_opticas: ''
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCliente();
  }, [id]);

  useEffect(() => {
    if (cliente === null || cliente === undefined) {
      console.warn('Cliente não encontrado ou nulo:', cliente);
    } else {
      console.log('Dados do cliente carregados:', cliente);
    }
    if (error) {
      console.error('Erro ao carregar cliente:', error);
    }
  }, [cliente, error]);

  useEffect(() => {
    if (cliente) {
      setOpticalForm({
        grau_od: cliente.grau_od || '',
        grau_oe: cliente.grau_oe || '',
        dnp_od: cliente.dnp_od || '',
        dnp_oe: cliente.dnp_oe || '',
        adicao: cliente.adicao || '',
        observacoes_opticas: cliente.observacoes_opticas || ''
      });
    }
  }, [cliente]);

  const handleOpticalChange = (e) => {
    setOpticalForm({ ...opticalForm, [e.target.name]: e.target.value });
  };

  const handleOpticalSave = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/clientes/${id}/`, { ...cliente, ...opticalForm });
      setEditOptical(false);
      fetchCliente();
    } catch (err) {
      alert('Erro ao salvar dados ópticos.');
    }
  };

  const fetchCliente = async () => {
    setLoading(true);
    setError(null);
    console.log('Buscando cliente na API:', `/api/clientes/${id}/`);
    try {
      const res = await api.get(`/api/clientes/${id}/`);
      console.log('Resposta da API (cliente):', res.data);
      setCliente(res.data);
      // Buscar vendas desse cliente
      const vendasRes = await api.get(`/api/sales/?cliente=${id}`);
      setVendas(vendasRes.data.results || vendasRes.data);
    } catch (e) {
      console.error('Erro ao buscar cliente na API:', e);
      setCliente(null);
      setVendas([]);
      if (e.response && e.response.status === 404) {
        setError('Cliente não encontrado.');
      } else if (e.response && e.response.status === 401) {
        setError('Não autorizado. Faça login novamente.');
      } else {
        setError('Erro ao carregar dados do cliente.');
      }
    }
    setLoading(false);
  };

  if (loading) return <div className="p-6">Carregando...</div>;
  if (error || !cliente || Object.keys(cliente).length === 0) return <div className="p-6 text-red-600 font-semibold">{error || 'Cliente não encontrado.'}</div>;

  return (
    <div className="p-2 sm:p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="mb-4 text-blue-600 hover:underline">&larr; Voltar</button>
      {/* Dados Pessoais */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">{cliente.nome}</h1>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Dados Pessoais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><b>CPF:</b> {cliente.cpf || '-'}</div>
          <div><b>E-mail:</b> {cliente.email || '-'}</div>
          <div><b>Telefone:</b> {cliente.telefone || '-'}</div>
          <div><b>Data de Nascimento:</b> {cliente.data_nascimento || '-'}</div>
          <div><b>Sexo:</b> {cliente.sexo || '-'}</div>
          <div><b>Endereço:</b> {cliente.endereco || '-'} {cliente.numero ? `, ${cliente.numero}` : ''}</div>
          <div><b>Bairro:</b> {cliente.bairro || '-'}</div>
          <div><b>Cidade:</b> {cliente.cidade || '-'} - {cliente.estado || '-'}</div>
          <div><b>CEP:</b> {cliente.cep || '-'}</div>
        </div>
        <div className="mt-4"><b>Observações:</b><br />{cliente.observacoes || '-'}</div>
        <div className="mt-2 text-sm text-gray-500">Cadastrado em: {new Date(cliente.criado_em).toLocaleDateString()}</div>
      </div>
      {/* Dados Ópticos */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-blue-700 flex items-center gap-2">
            <span role="img" aria-label="óculos">👓</span> Dados Ópticos
          </h2>
          {!editOptical && (
            <button onClick={() => setEditOptical(true)} className="text-blue-600 hover:underline text-sm">Editar Dados Ópticos</button>
          )}
        </div>
        {editOptical ? (
          <form onSubmit={handleOpticalSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grau OD</label>
              <input type="text" name="grau_od" value={opticalForm.grau_od} onChange={handleOpticalChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grau OE</label>
              <input type="text" name="grau_oe" value={opticalForm.grau_oe} onChange={handleOpticalChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DNP OD</label>
              <input type="text" name="dnp_od" value={opticalForm.dnp_od} onChange={handleOpticalChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DNP OE</label>
              <input type="text" name="dnp_oe" value={opticalForm.dnp_oe} onChange={handleOpticalChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adição</label>
              <input type="text" name="adicao" value={opticalForm.adicao} onChange={handleOpticalChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações Ópticas</label>
              <textarea name="observacoes_opticas" value={opticalForm.observacoes_opticas} onChange={handleOpticalChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div className="md:col-span-2 flex gap-2 mt-2">
              <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">Salvar</button>
              <button type="button" onClick={() => setEditOptical(false)} className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg">Cancelar</button>
            </div>
          </form>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><b>Grau OD:</b> {cliente.grau_od || '-'}</div>
              <div><b>Grau OE:</b> {cliente.grau_oe || '-'}</div>
              <div><b>DNP OD:</b> {cliente.dnp_od || '-'}</div>
              <div><b>DNP OE:</b> {cliente.dnp_oe || '-'}</div>
              <div><b>Adição:</b> {cliente.adicao || '-'}</div>
            </div>
            <div className="mt-4"><b>Observações Ópticas:</b><br />{cliente.observacoes_opticas || '-'}</div>
          </>
        )}
      </div>
      {/* Histórico de Compras */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Histórico de Compras</h2>
        {vendas.length === 0 ? (
          <div className="text-gray-500">Nenhuma compra registrada para este cliente.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produtos</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pagamento</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendas.map(venda => (
                <tr key={venda.id}>
                  <td className="px-4 py-2">{new Date(venda.sale_date).toLocaleDateString()}</td>
                  <td className="px-4 py-2">R$ {Number(venda.total_amount).toFixed(2)}</td>
                  <td className="px-4 py-2">{venda.items && venda.items.map(item => item.product_name).join(', ')}</td>
                  <td className="px-4 py-2">{venda.payment_method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 