import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  Receipt,
  Search,
  Printer,
  Ban,
  Eye,
  Calendar,
  X
} from 'lucide-react';
import { Venda } from '../../types/database';
import { formatCurrency, formatDate, formaPagamentoLabel } from '../../utils/formatters';
import { printReceipt } from '../../utils/receipt';

export const VendasView: React.FC = () => {
  const { db, config, refreshAll } = useDatabase();
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<'todas' | 'concluida' | 'cancelada'>('todas');
  const [vendaDetalhe, setVendaDetalhe] = useState<Venda | null>(null);

  useEffect(() => {
    carregarVendas();
  }, []);

  const carregarVendas = async () => {
    const data = await db.getVendas(200);
    setVendas(data);
  };

  const handleCancelarVenda = async (venda: Venda) => {
    if (
      confirm(
        `Deseja realmente cancelar a Venda #${venda.numero_venda}? Os itens retornarão automaticamente ao estoque!`
      )
    ) {
      await db.cancelarVenda(venda.id);
      await carregarVendas();
      await refreshAll();
    }
  };

  const vendasFiltradas = vendas.filter(v => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      String(v.numero_venda).includes(term) ||
      (v.cliente_nome && v.cliente_nome.toLowerCase().includes(term));
    const matchesStatus = statusFiltro === 'todas' || v.status === statusFiltro;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Histórico de Vendas</h1>
          <p className="text-sm text-slate-400">
            Registro de todas as vendas emitidas, cancelamentos e reimpressão de cupons.
          </p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="glass-card p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por número da venda ou cliente..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          {(['todas', 'concluida', 'cancelada'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFiltro(st)}
              className={`px-3 py-1.5 rounded-lg capitalize font-medium transition ${
                statusFiltro === st
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st === 'todas' ? 'Todas as Vendas' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Vendas */}
      <div className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-900/90 backdrop-blur border-b border-slate-800 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Venda</th>
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Pagamento</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Total Líquido</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {vendasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500 italic">
                    Nenhuma venda encontrada.
                  </td>
                </tr>
              ) : (
                vendasFiltradas.map(v => (
                  <tr key={v.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">#{v.numero_venda}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{formatDate(v.created_at)}</td>
                    <td className="py-3 px-4 text-slate-200 font-medium">
                      {v.cliente_nome || 'Consumidor Final'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                        {formaPagamentoLabel[v.forma_pagamento] || v.forma_pagamento}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          v.status === 'concluida'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(v.total_liquido)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setVendaDetalhe(v)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 transition"
                          title="Ver Itens da Venda"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => config && printReceipt(v, config)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Reimprimir Cupom"
                        >
                          <Printer size={14} />
                        </button>
                        {v.status === 'concluida' && (
                          <button
                            onClick={() => handleCancelarVenda(v)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-rose-400 transition"
                            title="Cancelar Venda e Estornar Estoque"
                          >
                            <Ban size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALHES DA VENDA */}
      {vendaDetalhe && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg rounded-3xl p-6 space-y-4 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Detalhes da Venda #{vendaDetalhe.numero_venda}
                </h3>
                <p className="text-xs text-slate-400">
                  {formatDate(vendaDetalhe.created_at)} • {vendaDetalhe.cliente_nome || 'Consumidor Final'}
                </p>
              </div>
              <button onClick={() => setVendaDetalhe(null)} className="text-slate-400">
                <X size={18} />
              </button>
            </div>

            {/* Itens */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              <table className="w-full text-xs text-left">
                <thead className="text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="py-1">Item</th>
                    <th className="py-1 text-center">Qtd</th>
                    <th className="py-1 text-right">Unitário</th>
                    <th className="py-1 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {vendaDetalhe.itens?.map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td className="py-2 text-slate-200">{it.produto_nome}</td>
                      <td className="py-2 text-center text-slate-400 font-mono">{it.quantidade}</td>
                      <td className="py-2 text-right text-slate-400 font-mono">
                        {formatCurrency(it.preco_unitario)}
                      </td>
                      <td className="py-2 text-right text-emerald-400 font-mono font-bold">
                        {formatCurrency(it.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Resumo */}
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Total Bruto:</span>
                <span className="font-mono">{formatCurrency(vendaDetalhe.total_bruto)}</span>
              </div>
              {vendaDetalhe.desconto > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Desconto:</span>
                  <span className="font-mono">- {formatCurrency(vendaDetalhe.desconto)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-100 font-bold pt-1 border-t border-slate-800">
                <span>TOTAL LÍQUIDO:</span>
                <span className="font-mono text-emerald-400 text-base">
                  {formatCurrency(vendaDetalhe.total_liquido)}
                </span>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => {
                  if (config) printReceipt(vendaDetalhe, config);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center space-x-2"
              >
                <Printer size={14} />
                <span>Imprimir Cupom</span>
              </button>
              <button
                onClick={() => setVendaDetalhe(null)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
