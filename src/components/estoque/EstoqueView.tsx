import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  History,
  AlertTriangle,
  X,
  Check
} from 'lucide-react';
import { MovimentacaoEstoque, Produto } from '../../types/database';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const EstoqueView: React.FC = () => {
  const { db, refreshAll } = useDatabase();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [somenteEstoqueBaixo, setSomenteEstoqueBaixo] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'produtos' | 'historico'>('produtos');

  // Modais
  const [modalProduto, setModalProduto] = useState(false);
  const [modalAjuste, setModalAjuste] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [produtoParaAjuste, setProdutoParaAjuste] = useState<Produto | null>(null);

  // Form Produto
  const [formData, setFormData] = useState({
    nome: '',
    codigo_barras: '',
    descricao: '',
    preco_custo: '0.00',
    preco_venda: '0.00',
    estoque_atual: '0',
    estoque_minimo: '5',
    unidade_medida: 'UN',
    categoria: 'Geral'
  });

  // Form Ajuste
  const [ajusteQtd, setAjusteQtd] = useState('1');
  const [ajusteTipo, setAjusteTipo] = useState<'entrada' | 'saida' | 'ajuste'>('entrada');
  const [ajusteMotivo, setAjusteMotivo] = useState('Compra / Reposição de estoque');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const prods = await db.getProdutos();
    const movs = await db.getMovimentacoesEstoque();
    setProdutos(prods);
    setMovimentacoes(movs);
  };

  const abrirModalNovo = () => {
    setProdutoEditando(null);
    setFormData({
      nome: '',
      codigo_barras: `789${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      descricao: '',
      preco_custo: '0.00',
      preco_venda: '0.00',
      estoque_atual: '0',
      estoque_minimo: '5',
      unidade_medida: 'UN',
      categoria: 'Geral'
    });
    setModalProduto(true);
  };

  const abrirModalEditar = (prod: Produto) => {
    setProdutoEditando(prod);
    setFormData({
      nome: prod.nome,
      codigo_barras: prod.codigo_barras,
      descricao: prod.descricao || '',
      preco_custo: prod.preco_custo.toFixed(2),
      preco_venda: prod.preco_venda.toFixed(2),
      estoque_atual: String(prod.estoque_atual),
      estoque_minimo: String(prod.estoque_minimo),
      unidade_medida: prod.unidade_medida,
      categoria: prod.categoria
    });
    setModalProduto(true);
  };

  const abrirModalAjuste = (prod: Produto) => {
    setProdutoParaAjuste(prod);
    setAjusteQtd('1');
    setAjusteTipo('entrada');
    setAjusteMotivo('Compra / Reposição de estoque');
    setModalAjuste(true);
  };

  const handleSalvarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim() || Number(formData.preco_venda) <= 0) {
      alert('Preencha o nome do produto e um preço de venda válido.');
      return;
    }

    try {
      await db.saveProduto({
        id: produtoEditando?.id,
        nome: formData.nome,
        codigo_barras: formData.codigo_barras,
        descricao: formData.descricao,
        preco_custo: Number(formData.preco_custo) || 0,
        preco_venda: Number(formData.preco_venda) || 0,
        estoque_atual: Number(formData.estoque_atual) || 0,
        estoque_minimo: Number(formData.estoque_minimo) || 0,
        unidade_medida: formData.unidade_medida,
        categoria: formData.categoria
      });

      setModalProduto(false);
      await carregarDados();
      await refreshAll();
    } catch (err: any) {
      alert(`Erro ao salvar produto: ${err?.message}`);
    }
  };

  const handleSalvarAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produtoParaAjuste || Number(ajusteQtd) <= 0) return;

    try {
      await db.ajustarEstoque(
        produtoParaAjuste.id,
        Number(ajusteQtd),
        ajusteTipo,
        ajusteMotivo
      );
      setModalAjuste(false);
      await carregarDados();
      await refreshAll();
    } catch (err: any) {
      alert(`Erro no ajuste: ${err?.message}`);
    }
  };

  const handleExcluirProduto = async (prod: Produto) => {
    if (confirm(`Deseja realmente remover o produto "${prod.nome}"?`)) {
      await db.deleteProduto(prod.id);
      await carregarDados();
      await refreshAll();
    }
  };

  const categorias = ['Todas', ...Array.from(new Set(produtos.map(p => p.categoria || 'Geral')))];

  const produtosFiltrados = produtos.filter(p => {
    const matchesCat = categoriaFiltro === 'Todas' || p.categoria === categoriaFiltro;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      p.nome.toLowerCase().includes(term) ||
      p.codigo_barras.toLowerCase().includes(term);
    const matchesEstoqueBaixo = !somenteEstoqueBaixo || p.estoque_atual <= p.estoque_minimo;
    return matchesCat && matchesSearch && matchesEstoqueBaixo;
  });

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Estoque & Produtos</h1>
          <p className="text-sm text-slate-400">
            Controle de inventário, custos, preços de venda e movimentações.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Abas */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setAbaAtiva('produtos')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                abaAtiva === 'produtos' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Catálogo ({produtos.length})
            </button>
            <button
              onClick={() => setAbaAtiva('historico')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                abaAtiva === 'historico' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History size={13} />
              <span>Histórico</span>
            </button>
          </div>

          <button
            onClick={abrirModalNovo}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
          >
            <Plus size={16} />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {abaAtiva === 'produtos' ? (
        <>
          {/* Barra de Filtros */}
          <div className="glass-card p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[240px] relative">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou código de barras..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <select
                value={categoriaFiltro}
                onChange={e => setCategoriaFiltro(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none"
              >
                {categorias.map(cat => (
                  <option key={cat} value={cat}>
                    Categoria: {cat}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setSomenteEstoqueBaixo(!somenteEstoqueBaixo)}
                className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 transition ${
                  somenteEstoqueBaixo
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-semibold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertTriangle size={13} />
                <span>Apenas Estoque Baixo</span>
              </button>
            </div>
          </div>

          {/* Tabela de Produtos */}
          <div className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-900/90 backdrop-blur border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Produto</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4 text-right">Custo</th>
                    <th className="py-3 px-4 text-right">Venda</th>
                    <th className="py-3 px-4 text-right">Margem</th>
                    <th className="py-3 px-4 text-center">Estoque Atual</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {produtosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-500 italic">
                        Nenhum produto cadastrado com esses filtros.
                      </td>
                    </tr>
                  ) : (
                    produtosFiltrados.map(prod => {
                      const margem =
                        prod.preco_venda > 0
                          ? ((prod.preco_venda - prod.preco_custo) / prod.preco_venda) * 100
                          : 0;
                      const isBaixo = prod.estoque_atual <= prod.estoque_minimo;

                      return (
                        <tr key={prod.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 font-mono text-slate-400">{prod.codigo_barras}</td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-200 block">{prod.nome}</span>
                            {prod.descricao && (
                              <span className="text-[11px] text-slate-500">{prod.descricao}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px]">
                              {prod.categoria}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-slate-400 font-mono">
                            {formatCurrency(prod.preco_custo)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-100 font-mono">
                            {formatCurrency(prod.preco_venda)}
                          </td>
                          <td className="py-3 px-4 text-right text-emerald-400 font-mono font-medium">
                            {margem.toFixed(0)}%
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                                isBaixo
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              }`}
                            >
                              {prod.estoque_atual} {prod.unidade_medida}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => abrirModalAjuste(prod)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition"
                                title="Ajustar Estoque / Entrada / Saída"
                              >
                                <ArrowUpRight size={14} />
                              </button>
                              <button
                                onClick={() => abrirModalEditar(prod)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 transition"
                                title="Editar Produto"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleExcluirProduto(prod)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-rose-400 transition"
                                title="Excluir Produto"
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
        </>
      ) : (
        /* Histórico de Movimentações */
        <div className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-200">Histórico de Entradas, Saídas e Vendas</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-900/90 backdrop-blur border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4 text-right">Quantidade</th>
                  <th className="py-3 px-4 text-center">Estoque Antes → Depois</th>
                  <th className="py-3 px-4">Motivo / Origem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {movimentacoes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500 italic">
                      Nenhuma movimentação registrada.
                    </td>
                  </tr>
                ) : (
                  movimentacoes.map(m => (
                    <tr key={m.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 text-slate-400 font-mono">{formatDate(m.created_at)}</td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{m.produto_nome}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                            m.tipo === 'entrada'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : m.tipo === 'saida'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {m.tipo}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                        {m.quantidade}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {m.estoque_anterior} → <strong className="text-slate-200">{m.estoque_novo}</strong>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{m.motivo || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL CADASTRO / EDIÇÃO DE PRODUTO */}
      {modalProduto && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg rounded-3xl p-6 space-y-4 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">
                {produtoEditando ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button onClick={() => setModalProduto(false)} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSalvarProduto} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Nome do Produto *</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Coca-Cola 2L, Arroz 5kg, Camiseta Algodão..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Código de Barras / EAN</label>
                  <input
                    type="text"
                    value={formData.codigo_barras}
                    onChange={e => setFormData({ ...formData, codigo_barras: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Categoria</label>
                  <input
                    type="text"
                    value={formData.categoria}
                    onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                    placeholder="Ex: Bebidas, Alimentos, Roupas..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Preço de Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.preco_custo}
                    onChange={e => setFormData({ ...formData, preco_custo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Preço de Venda (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.preco_venda}
                    onChange={e => setFormData({ ...formData, preco_venda: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Estoque Inicial</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.estoque_atual}
                    onChange={e => setFormData({ ...formData, estoque_atual: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Estoque Mínimo (Alerta)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.estoque_minimo}
                    onChange={e => setFormData({ ...formData, estoque_minimo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalProduto(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-lg shadow-emerald-500/20"
                >
                  {produtoEditando ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AJUSTE DE ESTOQUE */}
      {modalAjuste && produtoParaAjuste && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm rounded-3xl p-5 space-y-4 border border-slate-700 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100">
              Movimentação de Estoque: <span className="text-emerald-400">{produtoParaAjuste.nome}</span>
            </h3>

            <form onSubmit={handleSalvarAjuste} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tipo de Movimento</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  {(['entrada', 'saida', 'ajuste'] as const).map(tipo => (
                    <button
                      type="button"
                      key={tipo}
                      onClick={() => setAjusteTipo(tipo)}
                      className={`py-1.5 rounded-lg capitalize font-semibold transition ${
                        ajusteTipo === tipo ? 'bg-slate-700 text-white' : 'text-slate-400'
                      }`}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {ajusteTipo === 'ajuste' ? 'Novo Saldo Total' : 'Quantidade a Movimentar'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={ajusteQtd}
                  onChange={e => setAjusteQtd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Motivo / Observação</label>
                <input
                  type="text"
                  value={ajusteMotivo}
                  onChange={e => setAjusteMotivo(e.target.value)}
                  placeholder="Ex: Compra NF 123, Quebra, Venda balcão..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAjuste(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
