import React, { useState, useEffect, useRef } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  Save,
  Download,
  Upload,
  Cloud,
  Database,
  CheckCircle,
  AlertTriangle,
  Copy,
  RefreshCw,
  Building,
  RotateCcw,
  Check
} from 'lucide-react';
import { BackupService } from '../../services/backup/backup';
import { supabaseSync } from '../../services/database/supabase';
import { formatDate } from '../../utils/formatters';
import { BackupPayload } from '../../types/backup';

export const ConfigView: React.FC = () => {
  const { db, config, refreshConfig, refreshAll } = useDatabase();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Empresa
  const [formData, setFormData] = useState({
    nome_fantasia: '',
    razao_social: '',
    cnpj: '',
    telefone: '',
    endereco: '',
    mensagem_cupom: '',
    supabase_url: '',
    supabase_anon_key: '',
    supabase_ativo: false
  });

  // Estados Nuvem e Backup
  const [testandoNuvem, setTestandoNuvem] = useState(false);
  const [nuvemStatusMsg, setNuvemStatusMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [sincronizandoNuvem, setSincronizandoNuvem] = useState(false);
  const [copiadoSql, setCopiadoSql] = useState(false);

  // Modal Restauração
  const [modalRestaurar, setModalRestaurar] = useState(false);
  const [backupCarregado, setBackupCarregado] = useState<BackupPayload | null>(null);
  const [restaurando, setRestaurando] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData({
        nome_fantasia: config.nome_fantasia || '',
        razao_social: config.razao_social || '',
        cnpj: config.cnpj || '',
        telefone: config.telefone || '',
        endereco: config.endereco || '',
        mensagem_cupom: config.mensagem_cupom || '',
        supabase_url: config.supabase_url || '',
        supabase_anon_key: config.supabase_anon_key || '',
        supabase_ativo: config.supabase_ativo || false
      });
    }
  }, [config]);

  const handleSalvarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.saveConfig(formData);
      await refreshConfig();
      alert('Configurações salvas com sucesso!');
    } catch (err: any) {
      alert(`Erro ao salvar configurações: ${err?.message}`);
    }
  };

  const handleGerarBackup = async () => {
    try {
      await BackupService.gerarBackup(db);
      await refreshConfig();
      alert('Backup gerado e baixado com sucesso! Guarde este arquivo em um pendrive ou pasta segura.');
    } catch (err: any) {
      alert(`Erro ao gerar backup: ${err?.message}`);
    }
  };

  const handleSelecionarArquivoBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      const validacao = BackupService.validarArquivo(content);
      if (validacao.valido && validacao.data) {
        setBackupCarregado(validacao.data);
        setModalRestaurar(true);
      } else {
        alert(`Arquivo inválido: ${validacao.mensagem}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmarRestauracao = async () => {
    if (!backupCarregado) return;
    try {
      setRestaurando(true);
      await BackupService.restaurarBackup(db, backupCarregado);
      setModalRestaurar(false);
      setBackupCarregado(null);
      await refreshAll();
      alert('Backup restaurado com sucesso! Todos os dados foram restabelecidos.');
    } catch (err: any) {
      alert(`Erro na restauração: ${err?.message}`);
    } finally {
      setRestaurando(false);
    }
  };

  const handleTestarConexaoSupabase = async () => {
    if (!formData.supabase_url || !formData.supabase_anon_key) {
      setNuvemStatusMsg({
        tipo: 'erro',
        texto: 'Preencha a URL e a Chave Anônima do Supabase antes de testar.'
      });
      return;
    }

    setTestandoNuvem(true);
    setNuvemStatusMsg(null);
    const res = await supabaseSync.testConnection(formData.supabase_url, formData.supabase_anon_key);
    setTestandoNuvem(false);

    if (res.success) {
      setNuvemStatusMsg({ tipo: 'sucesso', texto: res.message });
    } else {
      setNuvemStatusMsg({ tipo: 'erro', texto: res.message });
    }
  };

  const handleSincronizarNuvemAgora = async () => {
    if (!formData.supabase_url || !formData.supabase_anon_key) {
      alert('Configure as credenciais do Supabase primeiro.');
      return;
    }

    try {
      setSincronizandoNuvem(true);
      const data = await db.exportAllData();
      const res = await supabaseSync.pushLocalToCloud(
        formData.supabase_url,
        formData.supabase_anon_key,
        data
      );

      if (res.success) {
        alert(res.message);
      } else {
        alert(`Falha ao sincronizar: ${res.message}`);
      }
    } catch (err: any) {
      alert(`Erro: ${err?.message}`);
    } finally {
      setSincronizandoNuvem(false);
    }
  };

  const handleCopiarSqlSupabase = () => {
    navigator.clipboard.writeText(supabaseSync.getSqlScript());
    setCopiadoSql(true);
    setTimeout(() => setCopiadoSql(false), 3000);
  };

  const handleResetarBanco = async () => {
    if (
      confirm(
        'ATENÇÃO: Deseja realmente reiniciar o banco de dados? Todos os dados atuais serão substituídos pelo catálogo de exemplo!'
      )
    ) {
      await db.resetDatabase();
      await refreshAll();
      alert('Banco reiniciado com dados de demonstração!');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
          Configurações, Backup & Nuvem
        </h1>
        <p className="text-sm text-slate-400">
          Gerencie o backup local do seu computador, dados cadastrais e conecte sua conta Supabase.
        </p>
      </div>

      {/* SEÇÃO 1: CENTRAL DE BACKUP LOCAL (DESTAQUE MÁXIMO) */}
      <div className="glass-card p-6 rounded-3xl space-y-5 border border-emerald-500/30 glow-emerald">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Central de Backup & Restauração Local</h2>
              <p className="text-xs text-slate-400">
                Garante que você nunca perca suas vendas e estoque mesmo se formatar o Windows.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400">Último backup realizado:</span>
            <p className="text-sm font-bold text-slate-200 font-mono">
              {formatDate(config?.ultimo_backup_at) || 'Nunca realizado'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Botão Exportar Backup */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <Download size={16} className="text-emerald-400" />
                <span>Exportar Arquivo de Backup</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Gera um arquivo seguro <code>.nexflow</code> contendo todo o catálogo de produtos, clientes,
                vendas e financeiro para salvar no seu computador ou pendrive.
              </p>
            </div>

            <button
              onClick={handleGerarBackup}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center space-x-2"
            >
              <Download size={15} />
              <span>Gerar e Baixar Backup (.nexflow)</span>
            </button>
          </div>

          {/* Botão Importar / Restaurar Backup */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <Upload size={16} className="text-blue-400" />
                <span>Restaurar Backup Existente</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Recupere todas as informações a partir de um arquivo de backup <code>.nexflow</code> salvo
                anteriormente.
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleSelecionarArquivoBackup}
              accept=".nexflow,.json"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition flex items-center justify-center space-x-2"
            >
              <Upload size={15} />
              <span>Selecionar Arquivo para Restaurar</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: DADOS DA EMPRESA */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
            <Building size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Dados da Empresa / Loja</h2>
            <p className="text-xs text-slate-400">Informações impressas no cabeçalho do cupom térmico.</p>
          </div>
        </div>

        <form onSubmit={handleSalvarConfig} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nome Fantasia da Loja *</label>
              <input
                type="text"
                required
                value={formData.nome_fantasia}
                onChange={e => setFormData({ ...formData, nome_fantasia: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Razão Social</label>
              <input
                type="text"
                value={formData.razao_social}
                onChange={e => setFormData({ ...formData, razao_social: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">CNPJ ou CPF</label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Telefone de Contato</label>
              <input
                type="text"
                value={formData.telefone}
                onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Endereço Completo</label>
              <input
                type="text"
                value={formData.endereco}
                onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-slate-300 font-semibold mb-1">
                Mensagem no Rodapé do Cupom de Venda
              </label>
              <input
                type="text"
                value={formData.mensagem_cupom}
                onChange={e => setFormData({ ...formData, mensagem_cupom: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition"
          >
            <Save size={15} />
            <span>Salvar Dados da Loja</span>
          </button>
        </form>
      </div>

      {/* SEÇÃO 3: MÓDULO NUVEM / SUPABASE (PARA RECORRÊNCIA SAAS) */}
      <div className="glass-card p-6 rounded-3xl space-y-4 border border-blue-500/30">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Cloud size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Integração Nuvem (Supabase / Acesso Web)
              </h2>
              <p className="text-xs text-slate-400">
                Conecte seu banco de dados PostgreSQL do Supabase para ter sincronização e acesso pelo navegador.
              </p>
            </div>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-300">
            <input
              type="checkbox"
              checked={formData.supabase_ativo}
              onChange={e => setFormData({ ...formData, supabase_ativo: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 border-slate-700"
            />
            <span>Ativar Sincronização em Nuvem</span>
          </label>
        </div>

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">URL do Projeto Supabase</label>
              <input
                type="text"
                value={formData.supabase_url}
                onChange={e => setFormData({ ...formData, supabase_url: e.target.value })}
                placeholder="https://xyzabcdefg.supabase.co"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Chave Pública (Anon Key)</label>
              <input
                type="password"
                value={formData.supabase_anon_key}
                onChange={e => setFormData({ ...formData, supabase_anon_key: e.target.value })}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Feedback de Status */}
          {nuvemStatusMsg && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
                nuvemStatusMsg.tipo === 'sucesso'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {nuvemStatusMsg.tipo === 'sucesso' ? (
                <CheckCircle size={16} className="text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle size={16} className="text-rose-400 shrink-0" />
              )}
              <span>{nuvemStatusMsg.texto}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={handleTestarConexaoSupabase}
              disabled={testandoNuvem}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition"
            >
              {testandoNuvem ? 'Testando...' : 'Testar Conexão com Supabase'}
            </button>

            <button
              type="button"
              onClick={handleSincronizarNuvemAgora}
              disabled={sincronizandoNuvem}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition flex items-center space-x-2 shadow-lg shadow-blue-500/20"
            >
              <RefreshCw size={14} className={sincronizandoNuvem ? 'animate-spin' : ''} />
              <span>{sincronizandoNuvem ? 'Enviando dados...' : 'Enviar Dados Locais para Nuvem'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopiarSqlSupabase}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-medium transition flex items-center space-x-1.5"
            >
              {copiadoSql ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiadoSql ? 'Script SQL Copiado!' : 'Copiar Script SQL das Tabelas para o Supabase'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEÇÃO 4: ÁREA DE PERIGO / REINICIAR BANCO */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
        <div>
          <span className="font-bold text-slate-300">Ambiente de Testes / Demonstração</span>
          <p className="text-slate-500 mt-0.5">
            Deseja resetar o banco de dados e restaurar o catálogo de demonstração?
          </p>
        </div>
        <button
          onClick={handleResetarBanco}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-700 transition flex items-center space-x-1.5"
        >
          <RotateCcw size={13} />
          <span>Restaurar Dados Exemplo</span>
        </button>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE RESTAURAÇÃO */}
      {modalRestaurar && backupCarregado && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md rounded-3xl p-6 space-y-4 border border-blue-500/40 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100">Restaurar Banco de Dados</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              O arquivo de backup foi validado com sucesso! Confira as informações abaixo antes de
              confirmar a substituição:
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Data do Backup:</span>
                <span className="font-mono text-slate-200">{formatDate(backupCarregado.data_geracao)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Loja:</span>
                <span className="font-semibold text-slate-200">{backupCarregado.config.nome_fantasia}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Produtos no Backup:</span>
                <span className="font-mono text-emerald-400 font-bold">{backupCarregado.produtos.length}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Clientes no Backup:</span>
                <span className="font-mono text-emerald-400 font-bold">{backupCarregado.clientes.length}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Vendas no Backup:</span>
                <span className="font-mono text-emerald-400 font-bold">{backupCarregado.vendas.length}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
              ⚠️ Os dados atuais serão substituídos integralmente pelos dados contidos neste arquivo de backup.
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setModalRestaurar(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarRestauracao}
                disabled={restaurando}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                {restaurando ? 'Restaurando...' : 'Confirmar e Restaurar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
