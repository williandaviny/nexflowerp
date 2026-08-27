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
import { IDatabaseService, DashboardMetrics } from './adapter';

const DB_STORAGE_KEY = 'nexflow_erp_v1_database';

interface DatabaseState {
  config: EmpresaConfig;
  produtos: Record<string, Produto>;
  clientes: Record<string, Cliente>;
  vendas: Record<string, Venda>;
  itens_venda: Record<string, ItemVenda>;
  movimentacoes_estoque: Record<string, MovimentacaoEstoque>;
  caixas: Record<string, CaixaSessao>;
  movimentos_caixa: Record<string, MovimentoCaixa>;
  sequence_venda: number;
}

const DEFAULT_CONFIG: EmpresaConfig = {
  id: 'default-config-uuid',
  nome_fantasia: 'Minha Empresa & Loja',
  razao_social: 'Minha Empresa Comercial LTDA',
  cnpj: '12.345.678/0001-90',
  telefone: '(11) 98765-4321',
  endereco: 'Rua Principal, 100 - Centro',
  mensagem_cupom: 'Obrigado pela preferência! Volte sempre.',
  supabase_ativo: false,
  ultimo_backup_at: undefined
};

// Dados de exemplo para primeiro uso
const DEMO_PRODUTOS: Array<Omit<Produto, 'created_at' | 'updated_at'>> = [
  {
    id: 'prod-001-coca',
    codigo_barras: '7894900010015',
    nome: 'Coca-Cola 2L Pet',
    descricao: 'Refrigerante de Cola 2 Litros',
    preco_custo: 6.50,
    preco_venda: 11.90,
    estoque_atual: 48,
    estoque_minimo: 12,
    unidade_medida: 'UN',
    categoria: 'Bebidas',
    sync_status: 'pending'
  },
  {
    id: 'prod-002-arroz',
    codigo_barras: '7891000100101',
    nome: 'Arroz Tipo 1 - 5kg Camil',
    descricao: 'Arroz branco tipo 1',
    preco_custo: 22.00,
    preco_venda: 29.90,
    estoque_atual: 25,
    estoque_minimo: 10,
    unidade_medida: 'PCT',
    categoria: 'Alimentos',
    sync_status: 'pending'
  },
  {
    id: 'prod-003-feijao',
    codigo_barras: '7891000100202',
    nome: 'Feijão Carioca 1kg',
    descricao: 'Feijão carioca selecionado',
    preco_custo: 5.20,
    preco_venda: 8.50,
    estoque_atual: 3,
    estoque_minimo: 10, // Alerta de estoque baixo!
    unidade_medida: 'KG',
    categoria: 'Alimentos',
    sync_status: 'pending'
  },
  {
    id: 'prod-004-cafe',
    codigo_barras: '7891000100303',
    nome: 'Café Torrado e Moído 500g',
    descricao: 'Café tradicional',
    preco_custo: 12.00,
    preco_venda: 18.90,
    estoque_atual: 15,
    estoque_minimo: 5,
    unidade_medida: 'PCT',
    categoria: 'Alimentos',
    sync_status: 'pending'
  },
  {
    id: 'prod-005-detergente',
    codigo_barras: '7891000100404',
    nome: 'Detergente Líquido 500ml Ypê',
    descricao: 'Detergente neutro',
    preco_custo: 1.80,
    preco_venda: 3.20,
    estoque_atual: 60,
    estoque_minimo: 15,
    unidade_medida: 'UN',
    categoria: 'Limpeza',
    sync_status: 'pending'
  }
];

const DEMO_CLIENTES: Array<Omit<Cliente, 'created_at' | 'updated_at'>> = [
  {
    id: 'cli-001-joao',
    nome: 'João Silva Santos',
    documento: '123.456.789-00',
    telefone: '(11) 99888-7766',
    email: 'joao.silva@email.com',
    endereco: 'Rua das Flores, 45 - Bairro Jardim',
    limite_credito: 500.00,
    saldo_devedor: 0.00,
    observacoes: 'Cliente preferencial',
    sync_status: 'pending'
  },
  {
    id: 'cli-002-maria',
    nome: 'Maria de Oliveira',
    documento: '234.567.890-11',
    telefone: '(11) 98777-6655',
    email: 'maria.oliveira@email.com',
    endereco: 'Av. Brasil, 1200 - Apto 32',
    limite_credito: 1000.00,
    saldo_devedor: 45.00, // Tem fiado pendente
    observacoes: 'Paga sempre no dia 10',
    sync_status: 'pending'
  }
];

export class SQLiteLocalService implements IDatabaseService {
  private state: DatabaseState;
  private isLoaded = false;

  constructor() {
    this.state = this.getInitialEmptyState();
  }

  private getInitialEmptyState(): DatabaseState {
    return {
      config: { ...DEFAULT_CONFIG },
      produtos: {},
      clientes: {},
      vendas: {},
      itens_venda: {},
      movimentacoes_estoque: {},
      caixas: {},
      movimentos_caixa: {},
      sequence_venda: 1000
    };
  }

  public async init(): Promise<void> {
    if (this.isLoaded) return;

    try {
      const stored = localStorage.getItem(DB_STORAGE_KEY);
      if (stored) {
        this.state = JSON.parse(stored);
      } else {
        // Inicializa com dados de exemplo
        this.seedDemoData();
        this.persist();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error('Erro ao carregar banco de dados local:', err);
      this.seedDemoData();
      this.persist();
      this.isLoaded = true;
    }
  }

  private seedDemoData(): void {
    const now = new Date().toISOString();
    
    // Seed Produtos
    DEMO_PRODUTOS.forEach(p => {
      this.state.produtos[p.id] = {
        ...p,
        created_at: now,
        updated_at: now,
        deleted_at: null
      };
    });

    // Seed Clientes
    DEMO_CLIENTES.forEach(c => {
      this.state.clientes[c.id] = {
        ...c,
        created_at: now,
        updated_at: now,
        deleted_at: null
      };
    });

    // Seed Caixa Aberto
    const caixaId = 'caixa-demo-aberto';
    this.state.caixas[caixaId] = {
      id: caixaId,
      operador: 'Administrador',
      valor_inicial: 150.00,
      status: 'aberto',
      data_abertura: now,
      data_fechamento: null,
      observacoes: 'Caixa de abertura inicial'
    };
  }

  private persist(): void {
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(this.state));
    } catch (err) {
      console.error('Falha ao persistir no armazenamento local:', err);
    }
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'id-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }

  // --- CONFIGURAÇÕES ---
  public async getConfig(): Promise<EmpresaConfig> {
    await this.init();
    return { ...this.state.config };
  }

  public async saveConfig(config: Partial<EmpresaConfig>): Promise<void> {
    await this.init();
    this.state.config = { ...this.state.config, ...config };
    this.persist();
  }

  // --- PRODUTOS ---
  public async getProdutos(): Promise<Produto[]> {
    await this.init();
    return Object.values(this.state.produtos)
      .filter(p => !p.deleted_at)
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }

  public async getProdutoById(id: string): Promise<Produto | null> {
    await this.init();
    const prod = this.state.produtos[id];
    return prod && !prod.deleted_at ? { ...prod } : null;
  }

  public async getProdutoByCodigo(codigo: string): Promise<Produto | null> {
    await this.init();
    const trimmed = codigo.trim();
    const prod = Object.values(this.state.produtos).find(
      p => !p.deleted_at && (p.codigo_barras === trimmed || p.id === trimmed)
    );
    return prod ? { ...prod } : null;
  }

  public async saveProduto(data: Partial<Produto> & { nome: string; preco_venda: number }): Promise<Produto> {
    await this.init();
    const now = new Date().toISOString();
    const id = data.id || this.generateId();
    const exists = this.state.produtos[id];

    const produto: Produto = {
      id,
      codigo_barras: data.codigo_barras?.trim() || `789${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      nome: data.nome.trim(),
      descricao: data.descricao || '',
      preco_custo: Number(data.preco_custo) || 0,
      preco_venda: Number(data.preco_venda) || 0,
      estoque_atual: Number(data.estoque_atual) || 0,
      estoque_minimo: Number(data.estoque_minimo) || 0,
      unidade_medida: data.unidade_medida || 'UN',
      categoria: data.categoria || 'Geral',
      created_at: exists ? exists.created_at : now,
      updated_at: now,
      deleted_at: null,
      sync_status: 'pending'
    };

    this.state.produtos[id] = produto;
    this.persist();
    return produto;
  }

  public async deleteProduto(id: string): Promise<void> {
    await this.init();
    if (this.state.produtos[id]) {
      this.state.produtos[id].deleted_at = new Date().toISOString();
      this.state.produtos[id].sync_status = 'pending';
      this.persist();
    }
  }

  public async ajustarEstoque(
    produtoId: string,
    quantidade: number,
    tipo: 'entrada' | 'saida' | 'ajuste',
    motivo: string
  ): Promise<void> {
    await this.init();
    const prod = this.state.produtos[produtoId];
    if (!prod) throw new Error('Produto não encontrado');

    const estoqueAnterior = prod.estoque_atual;
    let estoqueNovo = estoqueAnterior;

    if (tipo === 'entrada') estoqueNovo += quantidade;
    else if (tipo === 'saida') estoqueNovo = Math.max(0, estoqueAnterior - quantidade);
    else if (tipo === 'ajuste') estoqueNovo = quantidade;

    prod.estoque_atual = estoqueNovo;
    prod.updated_at = new Date().toISOString();
    prod.sync_status = 'pending';

    const movId = this.generateId();
    this.state.movimentacoes_estoque[movId] = {
      id: movId,
      produto_id: prod.id,
      produto_nome: prod.nome,
      tipo,
      quantidade,
      estoque_anterior: estoqueAnterior,
      estoque_novo: estoqueNovo,
      motivo,
      created_at: new Date().toISOString()
    };

    this.persist();
  }

  public async getMovimentacoesEstoque(limit = 50): Promise<MovimentacaoEstoque[]> {
    await this.init();
    return Object.values(this.state.movimentacoes_estoque)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  // --- CLIENTES ---
  public async getClientes(): Promise<Cliente[]> {
    await this.init();
    return Object.values(this.state.clientes)
      .filter(c => !c.deleted_at)
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }

  public async getClienteById(id: string): Promise<Cliente | null> {
    await this.init();
    const c = this.state.clientes[id];
    return c && !c.deleted_at ? { ...c } : null;
  }

  public async saveCliente(data: Partial<Cliente> & { nome: string }): Promise<Cliente> {
    await this.init();
    const now = new Date().toISOString();
    const id = data.id || this.generateId();
    const exists = this.state.clientes[id];

    const cliente: Cliente = {
      id,
      nome: data.nome.trim(),
      documento: data.documento || '',
      telefone: data.telefone || '',
      email: data.email || '',
      endereco: data.endereco || '',
      limite_credito: Number(data.limite_credito) || 0,
      saldo_devedor: Number(data.saldo_devedor) || (exists ? exists.saldo_devedor : 0),
      observacoes: data.observacoes || '',
      created_at: exists ? exists.created_at : now,
      updated_at: now,
      deleted_at: null,
      sync_status: 'pending'
    };

    this.state.clientes[id] = cliente;
    this.persist();
    return cliente;
  }

  public async deleteCliente(id: string): Promise<void> {
    await this.init();
    if (this.state.clientes[id]) {
      this.state.clientes[id].deleted_at = new Date().toISOString();
      this.state.clientes[id].sync_status = 'pending';
      this.persist();
    }
  }

  public async ajustarSaldoDevedorCliente(clienteId: string, valorDelta: number): Promise<void> {
    await this.init();
    const c = this.state.clientes[clienteId];
    if (c) {
      c.saldo_devedor = Math.max(0, (c.saldo_devedor || 0) + valorDelta);
      c.updated_at = new Date().toISOString();
      c.sync_status = 'pending';
      this.persist();
    }
  }

  // --- VENDAS & PDV ---
  public async getVendas(limit = 100): Promise<Venda[]> {
    await this.init();
    return Object.values(this.state.vendas)
      .filter(v => !v.deleted_at)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
      .map(v => ({
        ...v,
        itens: Object.values(this.state.itens_venda).filter(i => i.venda_id === v.id)
      }));
  }

  public async getVendaById(id: string): Promise<Venda | null> {
    await this.init();
    const v = this.state.vendas[id];
    if (!v || v.deleted_at) return null;
    return {
      ...v,
      itens: Object.values(this.state.itens_venda).filter(i => i.venda_id === v.id)
    };
  }

  public async criarVenda(
    vendaData: Omit<Venda, 'id' | 'numero_venda' | 'created_at' | 'updated_at'>,
    itensData: Array<{ produto_id: string; produto_nome: string; quantidade: number; preco_unitario: number; subtotal: number }>
  ): Promise<Venda> {
    await this.init();
    const now = new Date().toISOString();
    const vendaId = this.generateId();
    this.state.sequence_venda = (this.state.sequence_venda || 1000) + 1;
    const numeroVenda = this.state.sequence_venda;

    const venda: Venda = {
      ...vendaData,
      id: vendaId,
      numero_venda: numeroVenda,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      sync_status: 'pending'
    };

    this.state.vendas[vendaId] = venda;

    // Salvar Itens e Atualizar Estoque
    const itensSalvos: ItemVenda[] = [];
    for (const item of itensData) {
      const itemId = this.generateId();
      const itemVenda: ItemVenda = {
        id: itemId,
        venda_id: vendaId,
        produto_id: item.produto_id,
        produto_nome: item.produto_nome,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal,
        created_at: now
      };
      this.state.itens_venda[itemId] = itemVenda;
      itensSalvos.push(itemVenda);

      // Baixa automática de estoque
      const prod = this.state.produtos[item.produto_id];
      if (prod) {
        const estAnt = prod.estoque_atual;
        prod.estoque_atual = Math.max(0, prod.estoque_atual - item.quantidade);
        prod.updated_at = now;
        prod.sync_status = 'pending';

        // Registro de movimentação
        const movId = this.generateId();
        this.state.movimentacoes_estoque[movId] = {
          id: movId,
          produto_id: prod.id,
          produto_nome: prod.nome,
          tipo: 'saida',
          quantidade: item.quantidade,
          estoque_anterior: estAnt,
          estoque_novo: prod.estoque_atual,
          motivo: `Venda #${numeroVenda}`,
          created_at: now
        };
      }
    }

    // Se for venda fiada/a prazo, lança no saldo devedor do cliente
    if (venda.forma_pagamento === 'a_prazo' && venda.cliente_id) {
      await this.ajustarSaldoDevedorCliente(venda.cliente_id, venda.total_liquido);
    }

    this.persist();
    return { ...venda, itens: itensSalvos };
  }

  public async cancelarVenda(vendaId: string): Promise<void> {
    await this.init();
    const venda = this.state.vendas[vendaId];
    if (!venda || venda.status === 'cancelada') return;

    const now = new Date().toISOString();
    venda.status = 'cancelada';
    venda.updated_at = now;
    venda.sync_status = 'pending';

    // Estorna os itens de volta ao estoque
    const itens = Object.values(this.state.itens_venda).filter(i => i.venda_id === vendaId);
    for (const item of itens) {
      const prod = this.state.produtos[item.produto_id];
      if (prod) {
        const estAnt = prod.estoque_atual;
        prod.estoque_atual += item.quantidade;
        prod.updated_at = now;
        prod.sync_status = 'pending';

        const movId = this.generateId();
        this.state.movimentacoes_estoque[movId] = {
          id: movId,
          produto_id: prod.id,
          produto_nome: prod.nome,
          tipo: 'entrada',
          quantidade: item.quantidade,
          estoque_anterior: estAnt,
          estoque_novo: prod.estoque_atual,
          motivo: `Estorno Cancelamento Venda #${venda.numero_venda}`,
          created_at: now
        };
      }
    }

    // Se foi fiado, estorna o débito do cliente
    if (venda.forma_pagamento === 'a_prazo' && venda.cliente_id) {
      await this.ajustarSaldoDevedorCliente(venda.cliente_id, -venda.total_liquido);
    }

    this.persist();
  }

  // --- FRENTE DE CAIXA ---
  public async getCaixaAberto(): Promise<CaixaSessao | null> {
    await this.init();
    const caixas = Object.values(this.state.caixas);
    const aberto = caixas.find(c => c.status === 'aberto');
    return aberto ? { ...aberto } : null;
  }

  public async abrirCaixa(operador: string, valorInicial: number): Promise<CaixaSessao> {
    await this.init();
    const abertoAtual = await this.getCaixaAberto();
    if (abertoAtual) return abertoAtual;

    const id = this.generateId();
    const caixa: CaixaSessao = {
      id,
      operador: operador.trim() || 'Operador',
      valor_inicial: Number(valorInicial) || 0,
      status: 'aberto',
      data_abertura: new Date().toISOString(),
      data_fechamento: null
    };

    this.state.caixas[id] = caixa;
    this.persist();
    return caixa;
  }

  public async fecharCaixa(caixaId: string, saldoReal: number, observacoes?: string): Promise<CaixaSessao> {
    await this.init();
    const caixa = this.state.caixas[caixaId];
    if (!caixa) throw new Error('Caixa não encontrado');

    const agora = new Date().toISOString();
    
    // Calcula totais no período do caixa
    const vendasPeriodo = Object.values(this.state.vendas).filter(
      v => !v.deleted_at && v.status === 'concluida' && new Date(v.created_at) >= new Date(caixa.data_abertura)
    );
    const totalDinheiro = vendasPeriodo
      .filter(v => v.forma_pagamento === 'dinheiro')
      .reduce((acc, v) => acc + v.total_liquido, 0);

    const movs = Object.values(this.state.movimentos_caixa).filter(m => m.caixa_id === caixaId);
    const totalSuprimentos = movs.filter(m => m.tipo === 'suprimento').reduce((acc, m) => acc + m.valor, 0);
    const totalSangrias = movs.filter(m => m.tipo === 'sangria').reduce((acc, m) => acc + m.valor, 0);

    const saldoEsperado = caixa.valor_inicial + totalDinheiro + totalSuprimentos - totalSangrias;
    const diferenca = saldoReal - saldoEsperado;

    caixa.status = 'fechado';
    caixa.data_fechamento = agora;
    caixa.saldo_esperado = saldoEsperado;
    caixa.saldo_real = saldoReal;
    caixa.diferenca = diferenca;
    caixa.observacoes = observacoes;

    this.persist();
    return caixa;
  }

  public async adicionarMovimentoCaixa(
    caixaId: string,
    tipo: 'suprimento' | 'sangria',
    valor: number,
    motivo: string
  ): Promise<MovimentoCaixa> {
    await this.init();
    const id = this.generateId();
    const mov: MovimentoCaixa = {
      id,
      caixa_id: caixaId,
      tipo,
      valor: Number(valor) || 0,
      motivo: motivo.trim(),
      created_at: new Date().toISOString()
    };
    this.state.movimentos_caixa[id] = mov;
    this.persist();
    return mov;
  }

  public async getMovimentosCaixa(caixaId: string): Promise<MovimentoCaixa[]> {
    await this.init();
    return Object.values(this.state.movimentos_caixa)
      .filter(m => m.caixa_id === caixaId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // --- DASHBOARD & METRICAS ---
  public async getDashboardMetrics(): Promise<DashboardMetrics> {
    await this.init();
    const hojeStr = new Date().toISOString().split('T')[0];
    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();

    const todasVendas = Object.values(this.state.vendas).filter(v => !v.deleted_at && v.status === 'concluida');
    
    const vendasHoje = todasVendas.filter(v => v.created_at.startsWith(hojeStr));
    const vendasMes = todasVendas.filter(v => {
      const d = new Date(v.created_at);
      return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    });

    const faturamentoHoje = vendasHoje.reduce((acc, v) => acc + v.total_liquido, 0);
    const faturamentoMes = vendasMes.reduce((acc, v) => acc + v.total_liquido, 0);
    const ticketMedioHoje = vendasHoje.length > 0 ? faturamentoHoje / vendasHoje.length : 0;

    const produtos = Object.values(this.state.produtos).filter(p => !p.deleted_at);
    const produtosEstoqueBaixo = produtos.filter(p => p.estoque_atual <= p.estoque_minimo);

    const vendasPorFormaPagamento: Record<string, number> = {};
    todasVendas.forEach(v => {
      vendasPorFormaPagamento[v.forma_pagamento] = (vendasPorFormaPagamento[v.forma_pagamento] || 0) + v.total_liquido;
    });

    // Vendas dos últimos 7 dias
    const vendasUltimosDias: { data: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dataFormatada = d.toISOString().split('T')[0];
      const diaLabel = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
      const totalDia = todasVendas
        .filter(v => v.created_at.startsWith(dataFormatada))
        .reduce((acc, v) => acc + v.total_liquido, 0);

      vendasUltimosDias.push({ data: diaLabel, total: totalDia });
    }

    const vendasRecentes = await this.getVendas(8);

    return {
      totalVendasHoje: vendasHoje.length,
      faturamentoHoje,
      faturamentoMes,
      ticketMedioHoje,
      quantidadeProdutos: produtos.length,
      produtosEstoqueBaixo,
      vendasRecentes,
      vendasPorFormaPagamento,
      vendasUltimosDias
    };
  }

  // --- BACKUP E RESTAURAÇÃO ---
  public async exportAllData(): Promise<{
    config: EmpresaConfig;
    produtos: Produto[];
    clientes: Cliente[];
    vendas: Venda[];
    itens_venda: ItemVenda[];
    movimentacoes_estoque: MovimentacaoEstoque[];
    caixas: CaixaSessao[];
    movimentos_caixa: MovimentoCaixa[];
  }> {
    await this.init();
    return {
      config: { ...this.state.config },
      produtos: Object.values(this.state.produtos),
      clientes: Object.values(this.state.clientes),
      vendas: Object.values(this.state.vendas),
      itens_venda: Object.values(this.state.itens_venda),
      movimentacoes_estoque: Object.values(this.state.movimentacoes_estoque),
      caixas: Object.values(this.state.caixas),
      movimentos_caixa: Object.values(this.state.movimentos_caixa)
    };
  }

  public async importAllData(data: any): Promise<void> {
    if (!data || typeof data !== 'object') throw new Error('Dados de backup inválidos.');

    const newState: DatabaseState = this.getInitialEmptyState();

    if (data.config) newState.config = data.config;

    const toMap = <T extends { id: string }>(arr: any[]): Record<string, T> => {
      const map: Record<string, T> = {};
      if (Array.isArray(arr)) {
        arr.forEach(item => {
          if (item && item.id) map[item.id] = item;
        });
      }
      return map;
    };

    newState.produtos = toMap<Produto>(data.produtos);
    newState.clientes = toMap<Cliente>(data.clientes);
    newState.vendas = toMap<Venda>(data.vendas);
    newState.itens_venda = toMap<ItemVenda>(data.itens_venda);
    newState.movimentacoes_estoque = toMap<MovimentacaoEstoque>(data.movimentacoes_estoque);
    newState.caixas = toMap<CaixaSessao>(data.caixas);
    newState.movimentos_caixa = toMap<MovimentoCaixa>(data.movimentos_caixa);

    // Ajusta sequence de venda
    const nums = Object.values(newState.vendas).map(v => v.numero_venda || 1000);
    newState.sequence_venda = nums.length > 0 ? Math.max(...nums) : 1000;

    this.state = newState;
    this.persist();
  }

  public async resetDatabase(): Promise<void> {
    this.state = this.getInitialEmptyState();
    this.seedDemoData();
    this.persist();
  }
}

export const localDatabase = new SQLiteLocalService();
