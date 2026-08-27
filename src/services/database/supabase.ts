import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SQL_SUPABASE_POSTGRES_SCHEMA } from './schema';

export class SupabaseSyncService {
  private client: SupabaseClient | null = null;

  public getClient(url: string, anonKey: string): SupabaseClient {
    if (!this.client || this.client['supabaseUrl'] !== url) {
      this.client = createClient(url, anonKey, {
        auth: { persistSession: false }
      });
    }
    return this.client;
  }

  public async testConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!url || !anonKey) {
        return { success: false, message: 'URL e Chave Anônima do Supabase são obrigatórias.' };
      }

      if (!url.startsWith('https://')) {
        return { success: false, message: 'A URL do Supabase deve começar com https://' };
      }

      const client = this.getClient(url, anonKey);
      // Tenta consultar a tabela produtos ou config
      const { error } = await client.from('produtos').select('id').limit(1);

      if (error) {
        // Se a tabela não existir, avisa para rodar o script SQL
        if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
          return {
            success: true,
            message: 'Conectado com sucesso! Lembre-se de rodar o Script SQL no Painel do Supabase para criar as tabelas.'
          };
        }
        return { success: false, message: `Erro ao conectar: ${error.message}` };
      }

      return { success: true, message: 'Conexão com o Supabase estabelecida com sucesso! Tabelas verificadas.' };
    } catch (err: any) {
      return { success: false, message: `Falha na conexão: ${err?.message || 'Erro desconhecido'}` };
    }
  }

  public async pushLocalToCloud(
    url: string,
    anonKey: string,
    data: {
      produtos: any[];
      clientes: any[];
      vendas: any[];
      itens_venda: any[];
    }
  ): Promise<{ success: boolean; message: string; count: number }> {
    try {
      const client = this.getClient(url, anonKey);
      let count = 0;

      // Upsert Produtos
      if (data.produtos && data.produtos.length > 0) {
        const produtosClean = data.produtos.map(p => ({
          id: p.id,
          codigo_barras: p.codigo_barras,
          nome: p.nome,
          descricao: p.descricao,
          preco_custo: p.preco_custo,
          preco_venda: p.preco_venda,
          estoque_atual: p.estoque_atual,
          estoque_minimo: p.estoque_minimo,
          unidade_medida: p.unidade_medida,
          categoria: p.categoria,
          created_at: p.created_at,
          updated_at: p.updated_at,
          deleted_at: p.deleted_at
        }));
        const { error: pErr } = await client.from('produtos').upsert(produtosClean);
        if (pErr) throw new Error(`Falha ao sincronizar produtos: ${pErr.message}`);
        count += produtosClean.length;
      }

      // Upsert Clientes
      if (data.clientes && data.clientes.length > 0) {
        const clientesClean = data.clientes.map(c => ({
          id: c.id,
          nome: c.nome,
          documento: c.documento,
          telefone: c.telefone,
          email: c.email,
          endereco: c.endereco,
          limite_credito: c.limite_credito,
          saldo_devedor: c.saldo_devedor,
          observacoes: c.observacoes,
          created_at: c.created_at,
          updated_at: c.updated_at,
          deleted_at: c.deleted_at
        }));
        const { error: cErr } = await client.from('clientes').upsert(clientesClean);
        if (cErr) throw new Error(`Falha ao sincronizar clientes: ${cErr.message}`);
        count += clientesClean.length;
      }

      // Upsert Vendas
      if (data.vendas && data.vendas.length > 0) {
        const vendasClean = data.vendas.map(v => ({
          id: v.id,
          cliente_id: v.cliente_id || null,
          cliente_nome: v.cliente_nome,
          total_bruto: v.total_bruto,
          desconto: v.desconto,
          total_liquido: v.total_liquido,
          forma_pagamento: v.forma_pagamento,
          valor_pago: v.valor_pago,
          troco: v.troco,
          status: v.status,
          observacoes: v.observacoes,
          created_at: v.created_at,
          updated_at: v.updated_at,
          deleted_at: v.deleted_at
        }));
        const { error: vErr } = await client.from('vendas').upsert(vendasClean);
        if (vErr) throw new Error(`Falha ao sincronizar vendas: ${vErr.message}`);
        count += vendasClean.length;
      }

      return {
        success: true,
        message: `Sincronização com a nuvem concluída com sucesso! ${count} registros atualizados.`,
        count
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Erro durante a sincronização.', count: 0 };
    }
  }

  public getSqlScript(): string {
    return SQL_SUPABASE_POSTGRES_SCHEMA;
  }
}

export const supabaseSync = new SupabaseSyncService();
