import React, { useEffect, useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  ShoppingCart,
  Calendar,
  CreditCard,
  Printer
} from 'lucide-react';
import { formatCurrency, formatDate, formaPagamentoLabel } from '../../utils/formatters';
import { printReceipt } from '../../utils/receipt';

export const DashboardView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { metrics, config, refreshMetrics } = useDatabase();

  useEffect(() => {
    refreshMetrics();
  }, []);

  if (!metrics) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        Carregando indicadores...
      </div>
    );
  }

  const maxVendaDia = Math.max(...metrics.vendasUltimosDias.map(d => d.total), 100);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Painel de Controle</h1>
          <p className="text-sm text-slate-400">
            Resumo geral de vendas, faturamento e saúde do seu estoque.
          </p>
        </div>
        <button
          onClick={() => onNavigate('pdv')}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 transition transform active:scale-95"
        >
          <ShoppingCart size={16} />
          <span>Abrir Frente de Caixa (PDV)</span>
        </button>
      </div>

      {/* Alerta de Estoque Baixo */}
      {metrics.produtosEstoqueBaixo.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-rose-200">
                Atenção: {metrics.produtosEstoqueBaixo.length} produto(s) atingiram o estoque mínimo!
              </p>
              <p className="text-xs text-rose-300/80">
                {metrics.produtosEstoqueBaixo.map(p => `${p.nome} (${p.estoque_atual} un)`).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('estoque')}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold border border-rose-500/40 transition"
          >
            Repor Estoque
          </button>
        </div>
      )}

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturamento Hoje */}
        <div className="glass-card p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Faturamento Hoje</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-100">
              {formatCurrency(metrics.faturamentoHoje)}
            </div>
            <p className="text-xs text-emerald-400 font-medium mt-0.5">
              {metrics.totalVendasHoje} venda(s) realizadas hoje
            </p>
          </div>
        </div>

        {/* Faturamento Mês */}
        <div className="glass-card p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Faturamento Mês</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <TrendingUp size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-100">
              {formatCurrency(metrics.faturamentoMes)}
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Mês em andamento</p>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="glass-card p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Ticket Médio Hoje</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Calendar size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-100">
              {formatCurrency(metrics.ticketMedioHoje)}
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Média por cliente hoje</p>
          </div>
        </div>

        {/* Total de Itens no Estoque */}
        <div className="glass-card p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Catálogo Ativo</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Package size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-100">
              {metrics.quantidadeProdutos} <span className="text-sm font-normal text-slate-400">produtos</span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Cadastrados no sistema local</p>
          </div>
        </div>
      </div>

      {/* Gráficos e Distribuição */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Vendas Últimos 7 Dias */}
        <div className="lg:col-span-2 glass-card p-5 rounded-2xl space-y-4">
          <h2 className="text-base font-semibold text-slate-200">Vendas nos Últimos 7 Dias</h2>
          
          <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2">
            {metrics.vendasUltimosDias.map((dia, idx) => {
              const heightPercent = maxVendaDia > 0 ? (dia.total / maxVendaDia) * 100 : 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition">
                    {formatCurrency(dia.total)}
                  </span>
                  <div className="w-full bg-slate-800 rounded-t-lg h-36 flex items-end p-1">
                    <div
                      style={{ height: `${Math.max(8, heightPercent)}%` }}
                      className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-500 group-hover:brightness-110"
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-400">{dia.data}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Formas de Pagamento */}
        <div className="glass-card p-5 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 text-slate-200">
            <CreditCard size={18} className="text-emerald-400" />
            <h2 className="text-base font-semibold">Formas de Pagamento</h2>
          </div>

          <div className="space-y-3">
            {Object.keys(metrics.vendasPorFormaPagamento).length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">Nenhuma venda registrada ainda.</p>
            ) : (
              Object.entries(metrics.vendasPorFormaPagamento).map(([fp, total]) => (
                <div key={fp} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs">
                  <span className="text-slate-300 font-medium">{formaPagamentoLabel[fp] || fp}</span>
                  <span className="font-bold text-slate-100">{formatCurrency(total)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Vendas Recentes */}
      <div className="glass-card p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-200">Últimas Vendas Realizadas</h2>
          <button
            onClick={() => onNavigate('vendas')}
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
          >
            Ver Todas
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Venda</th>
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">Pagamento</th>
                <th className="py-2.5 px-3 text-right">Total Líquido</th>
                <th className="py-2.5 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {metrics.vendasRecentes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500 italic">
                    Nenhuma venda realizada. Clique em "Abrir Frente de Caixa" para registrar a primeira!
                  </td>
                </tr>
              ) : (
                metrics.vendasRecentes.map(v => (
                  <tr key={v.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-200">#{v.numero_venda}</td>
                    <td className="py-3 px-3 text-slate-400">{formatDate(v.created_at)}</td>
                    <td className="py-3 px-3 text-slate-300 font-medium">{v.cliente_nome || 'Consumidor Final'}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                        {formaPagamentoLabel[v.forma_pagamento] || v.forma_pagamento}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-400 font-mono text-sm">
                      {formatCurrency(v.total_liquido)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => config && printReceipt(v, config)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Reimprimir Cupom Térmico"
                      >
                        <Printer size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
