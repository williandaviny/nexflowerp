import { Cliente, EmpresaConfig, ItemVenda, MovimentacaoEstoque, MovimentoCaixa, CaixaSessao, Produto, Venda } from './database';

export interface BackupPayload {
  versao: string;
  app: string;
  data_geracao: string;
  total_registros: number;
  config: EmpresaConfig;
  produtos: Produto[];
  clientes: Cliente[];
  vendas: Venda[];
  itens_venda: ItemVenda[];
  movimentacoes_estoque: MovimentacaoEstoque[];
  caixas: CaixaSessao[];
  movimentos_caixa: MovimentoCaixa[];
  checksum: string;
}

export interface BackupValidationResult {
  valido: boolean;
  mensagem: string;
  data?: BackupPayload;
  total_produtos?: number;
  total_clientes?: number;
  total_vendas?: number;
}
