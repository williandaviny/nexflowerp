import {
  Cliente,
  EmpresaConfig,
  ItemVenda,
  MovimentacaoEstoque,
  MovimentoCaixa,
  CaixaSessao,
  Produto,
  Venda
} from '../../types/database';

export interface DashboardMetrics {
  totalVendasHoje: number;
  faturamentoHoje: number;
  faturamentoMes: number;
  ticketMedioHoje: number;
  quantidadeProdutos: number;
  produtosEstoqueBaixo: Produto[];
  vendasRecentes: Venda[];
  vendasPorFormaPagamento: Record<string, number>;
  vendasUltimosDias: { data: string; total: number }[];
}

export interface IDatabaseService {
  init(): Promise<void>;
  
  // Configurações
  getConfig(): Promise<EmpresaConfig>;
  saveConfig(config: Partial<EmpresaConfig>): Promise<void>;

  // Produtos e Estoque
  getProdutos(): Promise<Produto[]>;
  getProdutoById(id: string): Promise<Produto | null>;
  getProdutoByCodigo(codigo: string): Promise<Produto | null>;
  saveProduto(produto: Partial<Produto> & { nome: string; preco_venda: number }): Promise<Produto>;
  deleteProduto(id: string): Promise<void>;
  ajustarEstoque(produtoId: string, quantidade: number, tipo: 'entrada' | 'saida' | 'ajuste', motivo: string): Promise<void>;
  getMovimentacoesEstoque(limit?: number): Promise<MovimentacaoEstoque[]>;

  // Clientes e CRM
  getClientes(): Promise<Cliente[]>;
  getClienteById(id: string): Promise<Cliente | null>;
  saveCliente(cliente: Partial<Cliente> & { nome: string }): Promise<Cliente>;
  deleteCliente(id: string): Promise<void>;
  ajustarSaldoDevedorCliente(clienteId: string, valorDelta: number): Promise<void>;

  // Vendas e PDV
  getVendas(limit?: number): Promise<Venda[]>;
  getVendaById(id: string): Promise<Venda | null>;
  criarVenda(
    venda: Omit<Venda, 'id' | 'numero_venda' | 'created_at' | 'updated_at'>,
    itens: Array<{ produto_id: string; produto_nome: string; quantidade: number; preco_unitario: number; subtotal: number }>
  ): Promise<Venda>;
  cancelarVenda(vendaId: string): Promise<void>;

  // Frente de Caixa
  getCaixaAberto(): Promise<CaixaSessao | null>;
  abrirCaixa(operador: string, valorInicial: number): Promise<CaixaSessao>;
  fecharCaixa(caixaId: string, saldoReal: number, observacoes?: string): Promise<CaixaSessao>;
  adicionarMovimentoCaixa(caixaId: string, tipo: 'suprimento' | 'sangria', valor: number, motivo: string): Promise<MovimentoCaixa>;
  getMovimentosCaixa(caixaId: string): Promise<MovimentoCaixa[]>;

  // Métricas
  getDashboardMetrics(): Promise<DashboardMetrics>;

  // Backup e Restauração
  exportAllData(): Promise<{
    config: EmpresaConfig;
    produtos: Produto[];
    clientes: Cliente[];
    vendas: Venda[];
    itens_venda: ItemVenda[];
    movimentacoes_estoque: MovimentacaoEstoque[];
    caixas: CaixaSessao[];
    movimentos_caixa: MovimentoCaixa[];
  }>;
  importAllData(data: any): Promise<void>;
  resetDatabase(): Promise<void>;
}
