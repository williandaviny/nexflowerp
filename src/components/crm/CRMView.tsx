import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  Users,
  Plus,
  Search,
  Phone,
  MessageCircle,
  Edit2,
  Trash2,
  DollarSign,
  Receipt,
  X,
  CreditCard
} from 'lucide-react';
import { Cliente, Venda } from '../../types/database';
import { formatCurrency, formatCPF_CNPJ, formatPhone } from '../../utils/formatters';

export const CRMView: React.FC = () => {
  const { db, refreshAll } = useDatabase();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [somenteDevedores, setSomenteDevedores] = useState(false);

  // Modais
  const [modalCliente, setModalCliente] = useState(false);
  const [modalQuitacao, setModalQuitacao] = useState(false);
  const [modalHistorico, setModalHistorico] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);

  // Form Cliente
  const [formData, setFormData] = useState({
    nome: '',
    documento: '',
    telefone: '',
    email: '',
    endereco: '',
    limite_credito: '500.00',
    observacoes: ''
  });

  // Form Quitação Fiado
  const [valorQuitacao, setValorQuitacao] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const clis = await db.getClientes();
    const vens = await db.getVendas();
    setClientes(clis);
    setVendas(vens);
  };

  const abrirModalNovo = () => {
    setClienteEditando(null);
    setFormData({
      nome: '',
      documento: '',
      telefone: '',
      email: '',
      endereco: '',
      limite_credito: '500.00',
      observacoes: ''
    });
    setModalCliente(true);
  };

  const abrirModalEditar = (cli: Cliente) => {
    setClienteEditando(cli);
    setFormData({
      nome: cli.nome,
      documento: cli.documento || '',
      telefone: cli.telefone || '',
      email: cli.email || '',
      endereco: cli.endereco || '',
      limite_credito: String(cli.limite_credito || 0),
      observacoes: cli.observacoes || ''
    });
    setModalCliente(true);
  };

  const abrirModalQuitacao = (cli: Cliente) => {
    setClienteSelecionado(cli);
    setValorQuitacao(String(cli.saldo_devedor));
    setModalQuitacao(true);
  };

  const abrirModalHistorico = (cli: Cliente) => {
    setClienteSelecionado(cli);
    setModalHistorico(true);
  };

  const handleSalvarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      alert('Preencha o nome do cliente.');
      return;
    }

    try {
      await db.saveCliente({
        id: clienteEditando?.id,
        nome: formData.nome,
        documento: formData.documento,
        telefone: formData.telefone,
        email: formData.email,
        endereco: formData.endereco,
        limite_credito: Number(formData.limite_credito) || 0,
        observacoes: formData.observacoes
      });

      setModalCliente(false);
      await carregarDados();
      await refreshAll();
    } catch (err: any) {
      alert(`Erro ao salvar cliente: ${err?.message}`);
    }
  };

  const handleQuitarFiado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteSelecionado || Number(valorQuitacao) <= 0) return;

    try {
      const valor = Number(valorQuitacao);
      await db.ajustarSaldoDevedorCliente(clienteSelecionado.id, -valor);
      setModalQuitacao(false);
      await carregarDados();
      await refreshAll();
    } catch (err: any) {
      alert(`Erro ao dar baixa no débito: ${err?.message}`);
    }
  };

  const handleExcluirCliente = async (cli: Cliente) => {
    if (confirm(`Deseja realmente excluir o cadastro de "${cli.nome}"?`)) {
      await db.deleteCliente(cli.id);
      await carregarDados();
      await refreshAll();
    }
  };

  const clientesFiltrados = clientes.filter(c => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      c.nome.toLowerCase().includes(term) ||
      (c.documento && c.documento.includes(term)) ||
      (c.telefone && c.telefone.includes(term));
    const matchesDevedor = !somenteDevedores || (c.saldo_devedor && c.saldo_devedor > 0);
    return matchesSearch && matchesDevedor;
  });

  const vendasDoCliente = clienteSelecionado
    ? vendas.filter(v => v.cliente_id === clienteSelecionado.id)
    : [];

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">CRM & Clientes</h1>
          <p className="text-sm text-slate-400">
            Cadastro de clientes, histórico de compras, limite de crédito e controle de fiado.
          </p>
        </div>

        <button
          onClick={abrirModalNovo}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
        >
          <Plus size={16} />
          <span>Cadastrar Cliente</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="glass-card p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, telefone ou CPF/CNPJ..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <button
          onClick={() => setSomenteDevedores(!somenteDevedores)}
          className={`px-3 py-1.5 rounded-xl border text-xs flex items-center space-x-1.5 transition ${
            somenteDevedores
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-semibold'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign size={13} />
          <span>Apenas com Débito / Fiado</span>
        </button>
      </div>

      {/* Tabela de Clientes */}
      <div className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-900/90 backdrop-blur border-b border-slate-800 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Telefone / WhatsApp</th>
                <th className="py-3 px-4">Documento</th>
                <th className="py-3 px-4 text-right">Limite de Crédito</th>
                <th className="py-3 px-4 text-right">Saldo Devedor (Fiado)</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500 italic">
                    Nenhum cliente cadastrado.
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map(cli => {
                  const phoneDigits = (cli.telefone || '').replace(/\D/g, '');
                  const temDebito = cli.saldo_devedor > 0;

                  return (
                    <tr key={cli.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-200 block">{cli.nome}</span>
                        {cli.endereco && (
                          <span className="text-[11px] text-slate-500">{cli.endereco}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {cli.telefone ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-300 font-mono">{formatPhone(cli.telefone)}</span>
                            <a
                              href={`https://wa.me/55${phoneDigits}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition"
                              title="Abrir WhatsApp"
                            >
                              <MessageCircle size={13} />
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {formatCPF_CNPJ(cli.documento) || '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300 font-mono">
                        {formatCurrency(cli.limite_credito)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {temDebito ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {formatCurrency(cli.saldo_devedor)}
                          </span>
                        ) : (
                          <span className="text-emerald-400">R$ 0,00</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {temDebito && (
                            <button
                              onClick={() => abrirModalQuitacao(cli)}
                              className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition"
                              title="Dar Baixa / Receber Fiado"
                            >
                              <DollarSign size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => abrirModalHistorico(cli)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-400 transition"
                            title="Histórico de Vendas"
                          >
                            <Receipt size={14} />
                          </button>
                          <button
                            onClick={() => abrirModalEditar(cli)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 transition"
                            title="Editar Cliente"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleExcluirCliente(cli)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-rose-400 transition"
                            title="Excluir Cliente"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CADASTRO / EDIÇÃO DE CLIENTE */}
      {modalCliente && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md rounded-3xl p-6 space-y-4 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">
                {clienteEditando ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button onClick={() => setModalCliente(false)} className="text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSalvarCliente} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do cliente ou razão social"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">CPF / CNPJ</label>
                  <input
                    type="text"
                    value={formData.documento}
                    onChange={e => setFormData({ ...formData, documento: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Endereço Completo</label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, número, bairro e cidade"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Limite de Crédito (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.limite_credito}
                    onChange={e => setFormData({ ...formData, limite_credito: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={formData.observacoes}
                  onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalCliente(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RECEBER FIADO / QUITAÇÃO */}
      {modalQuitacao && clienteSelecionado && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm rounded-3xl p-5 space-y-4 border border-slate-700 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100">
              Receber Fiado: <span className="text-emerald-400">{clienteSelecionado.nome}</span>
            </h3>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs">
              <span className="text-slate-400">Débito Atual:</span>
              <span className="block text-lg font-bold text-rose-400 font-mono">
                {formatCurrency(clienteSelecionado.saldo_devedor)}
              </span>
            </div>

            <form onSubmit={handleQuitarFiado} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Valor Pago pelo Cliente (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={clienteSelecionado.saldo_devedor}
                  required
                  value={valorQuitacao}
                  onChange={e => setValorQuitacao(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold text-lg focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalQuitacao(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold"
                >
                  Confirmar Baixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HISTÓRICO DE COMPRAS */}
      {modalHistorico && clienteSelecionado && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg rounded-3xl p-6 space-y-4 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">Histórico de Compras</h3>
                <p className="text-xs text-slate-400">{clienteSelecionado.nome}</p>
              </div>
              <button onClick={() => setModalHistorico(false)} className="text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {vendasDoCliente.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-6">
                  Nenhuma compra registrada para este cliente.
                </p>
              ) : (
                vendasDoCliente.map(v => (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-200">Venda #{v.numero_venda}</span>
                      <p className="text-[11px] text-slate-500">{new Date(v.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-400">
                        {formatCurrency(v.total_liquido)}
                      </span>
                      <p className="text-[10px] text-slate-400 uppercase">{v.forma_pagamento}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
