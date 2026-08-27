import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Lock,
  Unlock,
  DollarSign,
  Plus,
  X
} from 'lucide-react';
import { CaixaSessao, MovimentoCaixa } from '../../types/database';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const CaixaView: React.FC = () => {
  const { db, refreshAll } = useDatabase();
  const [caixaAberto, setCaixaAberto] = useState<CaixaSessao | null>(null);
  const [movimentos, setMovimentos] = useState<MovimentoCaixa[]>([]);

  // Modais
  const [modalAbrir, setModalAbrir] = useState(false);
  const [modalFechar, setModalFechar] = useState(false);
  const [modalMovimento, setModalMovimento] = useState(false);

  // Forms
  const [operadorNome, setOperadorNome] = useState('Administrador');
  const [fundoTroco, setFundoTroco] = useState('100.00');
  const [saldoRealContado, setSaldoRealContado] = useState('');
  const [tipoMov, setTipoMov] = useState<'suprimento' | 'sangria'>('suprimento');
  const [valorMov, setValorMov] = useState('');
  const [motivoMov, setMotivoMov] = useState('');

  useEffect(() => {
    carregarCaixa();
  }, []);

  const carregarCaixa = async () => {
    const caixa = await db.getCaixaAberto();
    setCaixaAberto(caixa);
    if (caixa) {
      const movs = await db.getMovimentosCaixa(caixa.id);
      setMovimentos(movs);
    }
  };

  const handleAbrirCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.abrirCaixa(operadorNome, Number(fundoTroco) || 0);
      setModalAbrir(false);
      await carregarCaixa();
      await refreshAll();
    } catch (err: any) {
      alert(`Erro ao abrir caixa: ${err?.message}`);
    }
  };

  const handleFecharCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caixaAberto) return;
    try {
      await db.fecharCaixa(caixaAberto.id, Number(saldoRealContado) || 0);
      setModalFechar(false);
      await carregarCaixa();
      await refreshAll();
    } catch (err: any) {
      alert(`Erro ao fechar caixa: ${err?.message}`);
    }
  };

  const handleSalvarMovimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caixaAberto || Number(valorMov) <= 0) return;
    try {
      await db.adicionarMovimentoCaixa(
        caixaAberto.id,
        tipoMov,
        Number(valorMov),
        motivoMov || (tipoMov === 'suprimento' ? 'Entrada de Troco' : 'Retirada de Caixa')
      );
      setModalMovimento(false);
      setValorMov('');
      setMotivoMov('');
      await carregarCaixa();
    } catch (err: any) {
      alert(`Erro ao registrar movimento: ${err?.message}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Controle de Caixa</h1>
          <p className="text-sm text-slate-400">
            Abertura, fechamento, suprimentos e sangrias do turno.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {caixaAberto ? (
            <>
              <button
                onClick={() => setModalMovimento(true)}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition"
              >
                <Plus size={14} />
                <span>Sangria / Suprimento</span>
              </button>
              <button
                onClick={() => {
                  setSaldoRealContado('');
                  setModalFechar(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition"
              >
                <Lock size={14} />
                <span>Fechar Caixa</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setModalAbrir(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
            >
              <Unlock size={14} />
              <span>Abrir Novo Caixa</span>
            </button>
          )}
        </div>
      </div>

      {caixaAberto ? (
        <div className="space-y-6">
          {/* Card Resumo do Caixa */}
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Unlock size={24} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-bold text-slate-100">Caixa Aberto em Andamento</h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                      ATIVO
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Operador: <strong className="text-slate-200">{caixaAberto.operador}</strong> • Aberto em:{' '}
                    {formatDate(caixaAberto.data_abertura)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400">Fundo de Troco Inicial</span>
                <p className="text-xl font-bold text-slate-100 font-mono mt-1">
                  {formatCurrency(caixaAberto.valor_inicial)}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400">Suprimentos / Entradas</span>
                <p className="text-xl font-bold text-emerald-400 font-mono mt-1">
                  +{' '}
                  {formatCurrency(
                    movimentos
                      .filter(m => m.tipo === 'suprimento')
                      .reduce((acc, m) => acc + m.valor, 0)
                  )}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400">Sangrias / Retiradas</span>
                <p className="text-xl font-bold text-rose-400 font-mono mt-1">
                  -{' '}
                  {formatCurrency(
                    movimentos
                      .filter(m => m.tipo === 'sangria')
                      .reduce((acc, m) => acc + m.valor, 0)
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Histórico de Movimentos do Caixa */}
          <div className="glass-card rounded-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-200">Movimentações Avulsas do Caixa</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Hora</th>
                    <th className="py-2.5 px-4">Tipo</th>
                    <th className="py-2.5 px-4">Motivo</th>
                    <th className="py-2.5 px-4 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {movimentos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500 italic">
                        Nenhum suprimento ou sangria registrado neste turno.
                      </td>
                    </tr>
                  ) : (
                    movimentos.map(m => (
                      <tr key={m.id}>
                        <td className="py-2.5 px-4 font-mono text-slate-400">{formatDate(m.created_at)}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              m.tipo === 'suprimento'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {m.tipo}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-300">{m.motivo}</td>
                        <td
                          className={`py-2.5 px-4 text-right font-mono font-bold ${
                            m.tipo === 'suprimento' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {formatCurrency(m.valor)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Caixa Fechado */
        <div className="glass-card p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto my-auto">
          <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto border border-slate-700">
            <Lock size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-200">Caixa Fechado</h2>
            <p className="text-xs text-slate-400 mt-1">
              Abra o caixa informando o operador e o valor do troco para iniciar as vendas do dia.
            </p>
          </div>
          <button
            onClick={() => setModalAbrir(true)}
            className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition"
          >
            Abrir Caixa Agora
          </button>
        </div>
      )}

      {/* MODAL ABRIR CAIXA */}
      {modalAbrir && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm rounded-3xl p-5 space-y-4 border border-slate-700 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100">Abrir Caixa de Turno</h3>
            <form onSubmit={handleAbrirCaixa} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome do Operador</label>
                <input
                  type="text"
                  required
                  value={operadorNome}
                  onChange={e => setOperadorNome(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Fundo de Troco Inicial (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={fundoTroco}
                  onChange={e => setFundoTroco(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold text-base focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAbrir(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold"
                >
                  Confirmar Abertura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FECHAR CAIXA */}
      {modalFechar && caixaAberto && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm rounded-3xl p-5 space-y-4 border border-slate-700 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100">Fechamento de Caixa</h3>
            <form onSubmit={handleFecharCaixa} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Valor em Dinheiro Contado na Gaveta (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={saldoRealContado}
                  onChange={e => setSaldoRealContado(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold text-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalFechar(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold"
                >
                  Encerrar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUPRIMENTO / SANGRIA */}
      {modalMovimento && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm rounded-3xl p-5 space-y-4 border border-slate-700 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100">Lançamento de Caixa</h3>
            <form onSubmit={handleSalvarMovimento} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoMov('suprimento')}
                    className={`py-2 rounded-xl font-bold transition ${
                      tipoMov === 'suprimento'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Suprimento (Entrada)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoMov('sangria')}
                    className={`py-2 rounded-xl font-bold transition ${
                      tipoMov === 'sangria'
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Sangria (Retirada)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={valorMov}
                  onChange={e => setValorMov(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Motivo / Descrição</label>
                <input
                  type="text"
                  value={motivoMov}
                  onChange={e => setMotivoMov(e.target.value)}
                  placeholder="Ex: Troco inicial, Pagamento de frete..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMovimento(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold"
                >
                  Lançar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
