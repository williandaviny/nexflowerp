export type SyncStatus = 'pending' | 'synced' | 'conflict' | 'error';

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  sync_status?: SyncStatus;
}

export interface Produto extends BaseEntity {
  codigo_barras: string;
  nome: string;
  descricao?: string;
  preco_custo: number;
  preco_venda: number;
  estoque_atual: number;
  estoque_minimo: number;
  unidade_medida: string; // 'UN' | 'KG' | 'L' | 'CX' | 'PCT'
  categoria: string;
}

export interface Cliente extends BaseEntity {
  nome: string;
  documento?: string; // CPF ou CNPJ
  telefone?: string;
  email?: string;
  endereco?: string;
  limite_credito: number;
  saldo_devedor: number; // Para compras no fiado / a prazo
  observacoes?: string;
}

export type FormaPagamento = 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'a_prazo' | 'misto';

export interface Venda extends BaseEntity {
  numero_venda: number;
  cliente_id?: string | null;
  cliente_nome?: string;
  total_bruto: number;
  desconto: number;
  total_liquido: number;
  forma_pagamento: FormaPagamento;
  valor_pago?: number;
  troco?: number;
  status: 'concluida' | 'cancelada';
  observacoes?: string;
  itens?: ItemVenda[];
}

export interface ItemVenda {
  id: string;
  venda_id: string;
  produto_id: string;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  created_at: string;
}

export interface MovimentacaoEstoque {
  id: string;
  produto_id: string;
  produto_nome: string;
  tipo: 'entrada' | 'saida' | 'ajuste';
  quantidade: number;
  estoque_anterior: number;
  estoque_novo: number;
  motivo: string;
  created_at: string;
}

export interface CaixaSessao {
  id: string;
  operador: string;
  valor_inicial: number;
  saldo_esperado?: number;
  saldo_real?: number;
  diferenca?: number;
  status: 'aberto' | 'fechado';
  data_abertura: string;
  data_fechamento?: string | null;
  observacoes?: string;
}

export interface MovimentoCaixa {
  id: string;
  caixa_id: string;
  tipo: 'suprimento' | 'sangria';
  valor: number;
  motivo: string;
  created_at: string;
}

export interface EmpresaConfig {
  id: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  telefone: string;
  endereco: string;
  mensagem_cupom: string;
  supabase_url?: string;
  supabase_anon_key?: string;
  supabase_ativo: boolean;
  ultimo_backup_at?: string;
}
