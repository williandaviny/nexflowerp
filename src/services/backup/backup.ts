import { IDatabaseService } from '../database/adapter';
import { BackupPayload, BackupValidationResult } from '../../types/backup';

export class BackupService {
  /**
   * Gera o arquivo de backup local completo e grava diretamente na pasta Downloads do Windows
   */
  public static async gerarBackup(db: IDatabaseService): Promise<string> {
    const rawData = await db.exportAllData();
    const agora = new Date().toISOString();
    
    // Contagem total de registros
    const totalRegistros = 
      (rawData.produtos?.length || 0) +
      (rawData.clientes?.length || 0) +
      (rawData.vendas?.length || 0) +
      (rawData.itens_venda?.length || 0) +
      (rawData.movimentacoes_estoque?.length || 0) +
      (rawData.caixas?.length || 0) +
      (rawData.movimentos_caixa?.length || 0);

    const payload: BackupPayload = {
      versao: '1.0.0',
      app: 'NexFlow ERP',
      data_geracao: agora,
      total_registros: totalRegistros,
      config: rawData.config,
      produtos: rawData.produtos || [],
      clientes: rawData.clientes || [],
      vendas: rawData.vendas || [],
      itens_venda: rawData.itens_venda || [],
      movimentacoes_estoque: rawData.movimentacoes_estoque || [],
      caixas: rawData.caixas || [],
      movimentos_caixa: rawData.movimentos_caixa || [],
      checksum: this.simpleChecksum(JSON.stringify(rawData))
    };

    const jsonString = JSON.stringify(payload, null, 2);
    
    // Atualiza a data do último backup na configuração
    await db.saveConfig({ ultimo_backup_at: agora });

    const dataFormatada = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `nexflow_backup_${dataFormatada}.nexflow`;

    try {
      // Grava no Windows através do comando nativo e abre a pasta Downloads com o arquivo destacado
      const { invoke } = await import('@tauri-apps/api/core');
      const savedPath = await invoke<string>('save_backup_file', {
        filename,
        content: jsonString
      });
      return savedPath;
    } catch {
      // Fallback para navegador web
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return `Downloads/${filename}`;
    }
  }

  /**
   * Valida a integridade do arquivo de backup
   */
  public static validarArquivo(conteudoJson: string): BackupValidationResult {
    try {
      const data = JSON.parse(conteudoJson) as BackupPayload;

      if (!data || typeof data !== 'object') {
        return { valido: false, mensagem: 'Arquivo corrompido ou formato não reconhecido.' };
      }

      if (data.app !== 'NexFlow ERP') {
        return { valido: false, mensagem: 'O arquivo informado não é um backup compatível do NexFlow ERP.' };
      }

      if (!Array.isArray(data.produtos) || !Array.isArray(data.clientes) || !Array.isArray(data.vendas)) {
        return { valido: false, mensagem: 'Estrutura de dados incompleta ou inválida no arquivo de backup.' };
      }

      return {
        valido: true,
        mensagem: 'Arquivo de backup íntegro e pronto para restauração.',
        data,
        total_produtos: data.produtos.length,
        total_clientes: data.clientes.length,
        total_vendas: data.vendas.length
      };
    } catch {
      return { valido: false, mensagem: 'Não foi possível ler o arquivo. Certifique-se de que é um arquivo .nexflow ou .json válido.' };
    }
  }

  /**
   * Restaura o banco de dados a partir de um backup validado
   */
  public static async restaurarBackup(db: IDatabaseService, backup: BackupPayload): Promise<void> {
    await db.importAllData({
      config: backup.config,
      produtos: backup.produtos,
      clientes: backup.clientes,
      vendas: backup.vendas,
      itens_venda: backup.itens_venda,
      movimentacoes_estoque: backup.movimentacoes_estoque,
      caixas: backup.caixas,
      movimentos_caixa: backup.movimentos_caixa
    });
  }

  private static simpleChecksum(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return 'chk_' + Math.abs(hash).toString(16);
  }
}
