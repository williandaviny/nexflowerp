import React, { useState, useEffect, useRef } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { useCart } from '../../context/CartContext';
import {
  Search,
  Barcode,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  CreditCard,
  Banknote,
  QrCode,
  Calendar,
  Printer,
  User,
  Tag,
  X
} from 'lucide-react';
import { Cliente, FormaPagamento, Produto, Venda } from '../../types/database';
import { formatCurrency } from '../../utils/formatters';
import { printReceipt } from '../../utils/receipt';

export const PDVView: React.FC = () => {
  const { db, config, refreshAll } = useDatabase();
  const {
    itens = [],
    clienteSelecionado,
    desconto = 0,
    totalBruto = 0,
    totalLiquido = 0,
    adicionarProduto,
    removerItem,
    alterarQuantidade,
    setDescontoValor,
    setCliente,
    limparCarrinho
  } = useCart();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');
  const [carregando, setCarregando] = useState(true);
  
  // Modais
  const [modalPagamento, setModalPagamento] = useState(false);
  const [modalCliente, setModalCliente] = useState(false);
  const [modalDesconto, setModalDesconto] = useState(false);
  const [vendaConcluida, setVendaConcluida] = useState<Venda | null>(null);

  // Estados de Pagamento
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('dinheiro');
  const [valorPago, setValorPago] = useState<string>('');
  const [descontoInput, setDescontoInput] = useState<string>('0');
  const [processando, setProcessando] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const prods = await db.getProdutos();
      const clis = await db.getClientes();
      setProdutos(Array.isArray(prods) ? prods : []);
      setClientes(Array.isArray(clis) ? clis : []);
    } catch (err) {
      console.error('Erro ao carregar dados do PDV:', err);
    } finally {
      setCarregando(false);
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  };

  const categorias = [
    'Todas',
    ...Array.from(new Set((produtos || []).map(p => p?.categoria || 'Geral').filter(Boolean)))
  ];

  const produtosFiltrados = (produtos || []).filter(p => {
    if (!p) return false;
    const cat = p.categoria || 'Geral';
    const matchesCat = categoriaAtiva === 'Todas' || cat === categoriaAtiva;
    const term = (searchTerm || '').toLowerCase().trim();
    if (!term) return matchesCat;

    const nome = (p.nome || '').toLowerCase();
    const codigo = (p.codigo_barras || '').toLowerCase();
    return matchesCat && (nome.includes(term) || codigo.includes(term));
  });

  const handleBarcodeOrSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = (searchTerm || '').trim();
    if (!term) return;

    // Busca exata por código de barras primeiro
    const exato = (produtos || []).find(
      p => p && (p.codigo_barras === term || p.id === term)
    );

    if (exato) {
      adicionarProduto(exato, 1);
      setSearchTerm('');
    } else if (produtosFiltrados.length === 1) {
      adicionarProduto(produtosFiltrados[0], 1);
      setSearchTerm('');
    }
  };

  const handleOpenPagamento = () => {
    if (!itens || itens.length === 0) {
      alert('Adicione pelo menos um item ao carrinho antes de finalizar a venda.');
      return;
    }
    setValorPago(Number(totalLiquido || 0).toFixed(2));
    setModalPagamento(true);
  };

  const handleFinalizarVenda = async () => {
    if (formaPagamento === 'a_prazo' && !clienteSelecionado) {
      alert('Para vender A Prazo / Fiado, é obrigatório selecionar um cliente!');
      return;
    }

    try {
      setProcessando(true);
      const vPago = Number(valorPago) || totalLiquido;
      const troco = formaPagamento === 'dinheiro' ? Math.max(0, vPago - totalLiquido) : 0;

      const novaVenda = await db.criarVenda(
        {
          cliente_id: clienteSelecionado?.id || null,
          cliente_nome: clienteSelecionado?.nome || 'Consumidor Final',
          total_bruto: totalBruto || 0,
          desconto: desconto || 0,
          total_liquido: totalLiquido || 0,
          forma_pagamento: formaPagamento,
          valor_pago: vPago,
          troco: troco,
          status: 'concluida',
          observacoes: ''
        },
        (itens || []).map(i => ({
          produto_id: i.produto.id,
          produto_nome: i.produto.nome,
          quantidade: i.quantidade,
          preco_unitario: i.preco_unitario,
          subtotal: i.subtotal
        }))
      );

      // Efeito de confetes seguro
      try {
        const confettiMod = await import('canvas-confetti');
        const fireConfetti = (confettiMod as any)?.default || confettiMod;
        if (typeof fireConfetti === 'function') {
          fireConfetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 }
          });
        }
      } catch (cErr) {
        console.log('Confetti opt-out:', cErr);
      }

      setVendaConcluida(novaVenda);
      setModalPagamento(false);
      limparCarrinho();
      await refreshAll();
      await carregarDados();
    } catch (err: any) {
      alert(`Erro ao finalizar venda: ${err?.message || 'Tente novamente'}`);
    } finally {
      setProcessando(false);
    }
  };

  const valorPagoNum = Number(valorPago) || 0;
  const trocoCalculado = Math.max(0, valorPagoNum - (totalLiquido || 0));

  if (carregando) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        Carregando Frente de Caixa...
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-950">
      {/* Coluna Esquerda: Catálogo e Busca de Produtos */}
      <div className="flex-1 flex flex-col border-r border-slate-800/80 p-6 overflow-hidden">
        {/* Barra de Busca e Leitor de Código de Barras */}
        <form onSubmit={handleBarcodeOrSearchSubmit} className="mb-4">
          <div className="relative flex items-center">
            <div className="absolute left-4 text-emerald-400">
              <Barcode size={22} />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Passe o leitor de código de barras ou digite o nome do produto (Enter para adicionar)..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-700/80 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm shadow-inner transition"
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition"
            >
              Buscar
            </button>
          </div>
        </form>

        {/* Categorias em Pílulas */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-3 mb-2 no-scrollbar">
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaAtiva(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                categoriaAtiva === cat
                  ? 'bg-slate-700 text-white font-bold border border-slate-600'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid de Produtos */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pr-1">
          {produtosFiltrados.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center text-slate-500 py-12">
              <Search size={32} className="mb-2 opacity-50" />
              <p className="text-sm">Nenhum produto encontrado com esse termo.</p>
            </div>
          ) : (
            produtosFiltrados.map(prod => {
              const estoque = Number(prod.estoque_atual) || 0;
              const estoqueMin = Number(prod.estoque_minimo) || 0;
              const semEstoque = estoque <= 0;

              return (
                <button
                  key={prod.id}
                  onClick={() => adicionarProduto(prod, 1)}
                  disabled={semEstoque}
                  className={`flex flex-col justify-between p-3.5 rounded-2xl text-left border transition group relative ${
                    semEstoque
                      ? 'bg-slate-900/40 border-slate-800/40 opacity-50 cursor-not-allowed'
                      : 'glass-card hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-95'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-mono">{prod.codigo_barras || 'S/C'}</span>
                      <span
                        className={`font-semibold ${
                          estoque <= estoqueMin ? 'text-rose-400' : 'text-slate-400'
                        }`}
                      >
                        Estoque: {estoque} {prod.unidade_medida || 'UN'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-100 text-sm line-clamp-2 group-hover:text-emerald-400 transition">
                      {prod.nome}
                    </h3>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-base font-bold text-emerald-400 font-mono">
                      {formatCurrency(prod.preco_venda)}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition">
                      <Plus size={14} />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Coluna Direita: Carrinho & Finalização do Cupom */}
      <div className="w-96 bg-slate-900/90 flex flex-col justify-between p-5 select-none shrink-0 border-l border-slate-800">
        {/* Cabeçalho do Carrinho */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100">Frente de Caixa</h2>
            {itens && itens.length > 0 && (
              <button
                onClick={limparCarrinho}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium transition"
              >
                Limpar Itens
              </button>
            )}
          </div>

          {/* Seletor de Cliente */}
          <div
            onClick={() => setModalCliente(true)}
            className="cursor-pointer p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between hover:bg-slate-800 transition"
          >
            <div className="flex items-center space-x-2 text-xs">
              <User size={14} className="text-slate-400" />
              <span className="text-slate-200 font-medium truncate max-w-[200px]">
                {clienteSelecionado ? clienteSelecionado.nome : 'Consumidor Final (Sem cadastro)'}
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">Alterar</span>
          </div>
        </div>

        {/* Lista de Itens no Carrinho */}
        <div className="flex-1 overflow-y-auto my-3 space-y-2 pr-1 divide-y divide-slate-800/40">
          {!itens || itens.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
              <div className="p-4 rounded-3xl bg-slate-800/40 text-slate-500 mb-2">
                <Barcode size={32} />
              </div>
              <p className="text-xs font-medium text-slate-400">O carrinho está vazio</p>
              <p className="text-[11px] text-slate-500 mt-1">Clique nos produtos ou passe o leitor</p>
            </div>
          ) : (
            itens.map(item => (
              <div key={item.produto.id} className="pt-2 flex items-center justify-between text-xs">
                <div className="flex-1 pr-2">
                  <p className="font-semibold text-slate-200 truncate">{item.produto.nome}</p>
                  <p className="text-[11px] text-slate-400">
                    {item.quantidade} x {formatCurrency(item.preco_unitario)}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Botões Quantidade */}
                  <div className="flex items-center space-x-1 bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                    <button
                      onClick={() => alterarQuantidade(item.produto.id, item.quantidade - 1)}
                      className="p-1 hover:bg-slate-700 text-slate-300 rounded"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="w-6 text-center font-bold text-slate-200 font-mono">
                      {item.quantidade}
                    </span>
                    <button
                      onClick={() => alterarQuantidade(item.produto.id, item.quantidade + 1)}
                      className="p-1 hover:bg-slate-700 text-slate-300 rounded"
                    >
                      <Plus size={11} />
                    </button>
                  </div>

                  <span className="font-bold text-emerald-400 font-mono w-16 text-right">
                    {formatCurrency(item.subtotal)}
                  </span>

                  <button
                    onClick={() => removerItem(item.produto.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Resumo de Valores e Ações */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Subtotal:</span>
              <span className="font-mono">{formatCurrency(totalBruto)}</span>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setModalDesconto(true)}
                className="text-slate-400 hover:text-emerald-400 flex items-center space-x-1 text-[11px] underline"
              >
                <Tag size={12} />
                <span>Desconto {desconto > 0 ? `(${formatCurrency(desconto)})` : ''}</span>
              </button>
              <span className="font-mono text-amber-400">
                {desconto > 0 ? `- ${formatCurrency(desconto)}` : 'R$ 0,00'}
              </span>
            </div>

            <div className="flex justify-between items-baseline pt-2 border-t border-slate-800 text-slate-100">
              <span className="text-sm font-bold">TOTAL A PAGAR:</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {formatCurrency(totalLiquido)}
              </span>
            </div>
          </div>

          <button
            onClick={handleOpenPagamento}
            disabled={!itens || itens.length === 0}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm tracking-wide transition shadow-lg flex items-center justify-center space-x-2 ${
              itens && itens.length > 0
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 shadow-emerald-500/25 hover:brightness-110 active:scale-98'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle size={18} />
            <span>PAGAR E FINALIZAR (F8)</span>
          </button>
        </div>
      </div>

      {/* MODAL DE PAGAMENTO */}
      {modalPagamento && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg rounded-3xl p-6 space-y-5 border border-slate-700/80 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100">Forma de Pagamento</h3>
              <button
                onClick={() => setModalPagamento(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Total Destacado */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-xs text-emerald-300 uppercase font-semibold">Total a Cobrar</span>
              <div className="text-3xl font-black text-emerald-400 font-mono mt-0.5">
                {formatCurrency(totalLiquido)}
              </div>
            </div>

            {/* Botões de Formas de Pagamento */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
                { id: 'pix', label: 'PIX Instantâneo', icon: QrCode },
                { id: 'cartao_credito', label: 'Cartão de Crédito', icon: CreditCard },
                { id: 'cartao_debito', label: 'Cartão de Débito', icon: CreditCard },
                { id: 'a_prazo', label: 'A Prazo / Fiado', icon: Calendar }
              ].map(f => {
                const Icon = f.icon;
                const active = formaPagamento === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      setFormaPagamento(f.id as FormaPagamento);
                      if (f.id !== 'dinheiro') setValorPago((totalLiquido || 0).toFixed(2));
                    }}
                    className={`flex items-center space-x-3 p-3 rounded-xl border text-xs font-semibold transition ${
                      active
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                        : 'bg-slate-900/60 text-slate-300 border-slate-700/80 hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={18} className={active ? 'text-slate-950' : 'text-emerald-400'} />
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Dinheiro: Cálculo de Troco */}
            {formaPagamento === 'dinheiro' && (
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor Recebido (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={valorPago}
                    onChange={e => setValorPago(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Troco a Devolver
                  </label>
                  <div className="px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700 font-mono font-bold text-lg text-emerald-400">
                    {formatCurrency(trocoCalculado)}
                  </div>
                </div>
              </div>
            )}

            {/* Aviso A Prazo / Fiado */}
            {formaPagamento === 'a_prazo' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                {clienteSelecionado ? (
                  <p>
                    O valor de <strong>{formatCurrency(totalLiquido)}</strong> será lançado no saldo
                    devedor de <strong>{clienteSelecionado.nome}</strong>.
                  </p>
                ) : (
                  <p className="font-bold text-rose-400">
                    Selecione um cliente para habilitar venda a prazo!
                  </p>
                )}
              </div>
            )}

            {/* Ações */}
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setModalPagamento(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Voltar
              </button>
              <button
                onClick={handleFinalizarVenda}
                disabled={processando || (formaPagamento === 'a_prazo' && !clienteSelecionado)}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
              >
                {processando ? 'Processando...' : 'Confirmar Venda'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DESCONTO */}
      {modalDesconto && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm rounded-3xl p-5 space-y-4 border border-slate-700/80 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100">Aplicar Desconto na Venda</h3>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Valor do Desconto em Reais (R$)</label>
              <input
                type="number"
                step="0.50"
                min="0"
                max={totalBruto}
                value={descontoInput}
                onChange={e => setDescontoInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono font-bold text-lg focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setModalDesconto(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setDescontoValor(Number(descontoInput) || 0);
                  setModalDesconto(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SELEÇÃO DE CLIENTE */}
      {modalCliente && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md rounded-3xl p-5 space-y-4 border border-slate-700/80 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">Vincular Cliente à Venda</h3>
              <button onClick={() => setModalCliente(false)} className="text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              <button
                onClick={() => {
                  setCliente(null);
                  setModalCliente(false);
                }}
                className={`w-full p-3 rounded-xl text-left text-xs border transition ${
                  clienteSelecionado === null
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Consumidor Final (Sem Cadastro)
              </button>

              {clientes.map(cli => (
                <button
                  key={cli.id}
                  onClick={() => {
                    setCliente(cli);
                    setModalCliente(false);
                  }}
                  className={`w-full p-3 rounded-xl text-left text-xs border transition flex items-center justify-between ${
                    clienteSelecionado?.id === cli.id
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-slate-200">{cli.nome}</p>
                    <p className="text-[11px] text-slate-500">{cli.telefone || cli.documento || 'Sem telefone'}</p>
                  </div>
                  {cli.saldo_devedor > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Débito: {formatCurrency(cli.saldo_devedor)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUCESSO VENDA CONCLUÍDA */}
      {vendaConcluida && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm rounded-3xl p-6 text-center space-y-4 border border-emerald-500/40 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100">Venda Concluída!</h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Venda #{vendaConcluida.numero_venda} • {formatCurrency(vendaConcluida.total_liquido)}
              </p>
            </div>

            {vendaConcluida.troco && vendaConcluida.troco > 0 ? (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <span className="text-slate-400">Troco do Cliente:</span>
                <span className="block text-lg font-bold text-emerald-400 font-mono">
                  {formatCurrency(vendaConcluida.troco)}
                </span>
              </div>
            ) : null}

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  if (config) printReceipt(vendaConcluida, config);
                }}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center space-x-2 transition"
              >
                <Printer size={16} />
                <span>Imprimir Cupom Térmico (80mm)</span>
              </button>

              <button
                onClick={() => setVendaConcluida(null)}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
              >
                Nova Venda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
