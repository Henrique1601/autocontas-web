'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  RefreshCw, 
  UploadCloud, 
  Zap, 
  Droplet, 
  Wifi, 
  FolderArchive, 
  Calendar, 
  DollarSign, 
  AlertCircle,
  CheckCircle2,
  Mail,
  Filter
} from 'lucide-react';
import { BillItem } from '@/types/bill';

export default function Home() {
  const [bills, setBills] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal de Configuração de E-mail
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [emailConfig, setEmailConfig] = useState({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    user: '',
    pass: '',
  });

  // Modal de Upload Manual
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadData, setUploadData] = useState({
    file: null as File | null,
    provider: 'CPFL',
    amount: '',
    dueDate: '',
    referenceMonth: '',
  });

  // Carrega as faturas salvas
  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/bills');
      const data = await res.json();
      if (data.success) {
        setBills(data.bills);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
    const savedEmail = localStorage.getItem('auto_contas_email_config');
    if (savedEmail) {
      try {
        setEmailConfig(JSON.parse(savedEmail));
      } catch (e) {}
    }
  }, []);

  // Executa Sincronização IMAP
  const handleSync = async () => {
    if (!emailConfig.user || !emailConfig.pass) {
      setShowConfigModal(true);
      return;
    }

    try {
      setSyncing(true);
      setStatusMessage(null);
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailConfig),
      });
      const data = await res.json();

      if (data.success) {
        setStatusMessage({ type: 'success', text: data.message });
        await fetchBills();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Erro na sincronização' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Erro de rede' });
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('auto_contas_email_config', JSON.stringify(emailConfig));
    setShowConfigModal(false);
    handleSync();
  };

  // Upload Manual
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file) return;

    const fd = new FormData();
    fd.append('file', uploadData.file);
    fd.append('provider', uploadData.provider);
    fd.append('amount', uploadData.amount);
    fd.append('dueDate', uploadData.dueDate);
    fd.append('referenceMonth', uploadData.referenceMonth);

    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        setShowUploadModal(false);
        setUploadData({ file: null, provider: 'CPFL', amount: '', dueDate: '', referenceMonth: '' });
        await fetchBills();
        setStatusMessage({ type: 'success', text: 'Comprovante importado e organizado com sucesso!' });
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Erro ao enviar arquivo.');
    }
  };

  // Filtros
  const filteredBills = bills.filter((b) => {
    const matchProvider = selectedProvider === 'ALL' || b.provider === selectedProvider;
    const matchMonth = selectedMonth === 'ALL' || b.referenceMonth === selectedMonth;
    return matchProvider && matchMonth;
  });

  // Estatísticas
  const totalAmount = filteredBills.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalCpfl = bills.filter((b) => b.provider === 'CPFL').length;
  const totalSabesp = bills.filter((b) => b.provider === 'SABESP').length;
  const totalVivo = bills.filter((b) => b.provider === 'VIVO').length;

  const monthsList = Array.from(new Set(bills.map((b) => b.referenceMonth))).filter(Boolean);

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'CPFL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Zap className="w-3.5 h-3.5" /> CPFL Energia
          </span>
        );
      case 'SABESP':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <Droplet className="w-3.5 h-3.5" /> Sabesp Água
          </span>
        );
      case 'VIVO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-500 border border-purple-500/20">
            <Wifi className="w-3.5 h-3.5" /> Vivo Internet
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            <FileText className="w-3.5 h-3.5" /> Outros
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <FolderArchive className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              AutoContas Web <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Pro</span>
            </h1>
            <p className="text-xs text-zinc-400">Download & Gestão Automática de Comprovantes (CPFL, Sabesp, Vivo)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition cursor-pointer"
          >
            <Mail className="w-4 h-4 text-zinc-400" />
            Configurar E-mail
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-zinc-400" />
            Upload Manual
          </button>

          <button
            onClick={handleSync}
            disabled={syncing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-md transition cursor-pointer ${
              syncing
                ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Buscando E-mails...' : 'Sincronizar Faturas'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Status Alerts */}
        {statusMessage && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                : 'bg-rose-950/40 text-rose-400 border-rose-800/50'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p>{statusMessage.text}</p>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Filtrado</span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-black mt-2 text-white">
              {totalAmount > 0
                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)
                : 'R$ --,--'}
            </p>
            <p className="text-xs text-zinc-500 mt-1">{filteredBills.length} comprovante(s) no escopo</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">CPFL (Luz)</span>
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-black mt-2 text-white">{totalCpfl}</p>
            <p className="text-xs text-zinc-500 mt-1">Faturas salvas</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Sabesp (Água)</span>
              <Droplet className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-black mt-2 text-white">{totalSabesp}</p>
            <p className="text-xs text-zinc-500 mt-1">Faturas salvas</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Vivo (Internet)</span>
              <Wifi className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-black mt-2 text-white">{totalVivo}</p>
            <p className="text-xs text-zinc-500 mt-1">Faturas salvas</p>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
              <Filter className="w-4 h-4" /> Filtros:
            </div>

            {/* Filtro Concessionária */}
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Todas as Concessionárias</option>
              <option value="CPFL">CPFL Energia (Luz)</option>
              <option value="SABESP">Sabesp (Água)</option>
              <option value="VIVO">Vivo (Internet)</option>
            </select>

            {/* Filtro Mês */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Todos os Meses</option>
              {monthsList.map((m) => (
                <option key={m} value={m}>
                  Mês {m}
                </option>
              ))}
            </select>
          </div>

          {/* Botão Baixar Todos (.ZIP) */}
          <a
            href={`/api/download-all?${selectedMonth !== 'ALL' ? `month=${encodeURIComponent(selectedMonth)}&` : ''}${selectedProvider !== 'ALL' ? `provider=${selectedProvider}` : ''}`}
            download
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold border border-zinc-700 transition w-full sm:w-auto cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Baixar Selecionados em Lote (.ZIP)
          </a>
        </div>

        {/* Lista / Tabela de Comprovantes */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Comprovantes e Faturas Arquivadas ({filteredBills.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-zinc-500 text-sm">Carregando faturas...</div>
          ) : filteredBills.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-600">
                <FolderArchive className="w-7 h-7" />
              </div>
              <p className="text-zinc-400 text-sm">Nenhum comprovante encontrado com os filtros selecionados.</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="text-xs px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium cursor-pointer"
                >
                  Conectar E-mail para Buscar
                </button>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="text-xs px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium cursor-pointer"
                >
                  Enviar PDF Manualmente
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-300">
                <thead className="bg-zinc-950/60 text-xs uppercase font-semibold text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-3">Concessionária</th>
                    <th className="px-6 py-3">Referência</th>
                    <th className="px-6 py-3">Vencimento</th>
                    <th className="px-6 py-3">Valor</th>
                    <th className="px-6 py-3">Origem</th>
                    <th className="px-6 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-zinc-800/30 transition">
                      <td className="px-6 py-4">{getProviderBadge(bill.provider)}</td>
                      <td className="px-6 py-4 font-medium text-white flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        {bill.referenceMonth}
                      </td>
                      <td className="px-6 py-4 text-zinc-400">{bill.dueDate}</td>
                      <td className="px-6 py-4 font-semibold text-emerald-400">
                        {bill.amount > 0
                          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amount)
                          : 'Ver PDF'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                          {bill.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a
                          href={`/api/bills/${bill.id}/download`}
                          download={bill.originalFileName}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs font-semibold border border-blue-500/20 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" /> Baixar PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Configuração E-mail IMAP */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-500" /> Conectar Caixa de Entrada (IMAP)
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              O sistema se conectará via protocolo seguro IMAP para encontrar os e-mails e anexos em PDF da CPFL, Sabesp e Vivo.
            </p>

            <form onSubmit={handleSaveConfig} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-300">Servidor IMAP</label>
                <input
                  type="text"
                  required
                  value={emailConfig.host}
                  onChange={(e) => setEmailConfig({ ...emailConfig, host: e.target.value })}
                  placeholder="imap.gmail.com"
                  className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-zinc-300">Porta</label>
                  <input
                    type="number"
                    value={emailConfig.port}
                    onChange={(e) => setEmailConfig({ ...emailConfig, port: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="ssl"
                    checked={emailConfig.secure}
                    onChange={(e) => setEmailConfig({ ...emailConfig, secure: e.target.checked })}
                    className="rounded border-zinc-700 bg-zinc-800 text-blue-600"
                  />
                  <label htmlFor="ssl" className="text-xs text-zinc-300">Conexão SSL/TLS</label>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300">Seu E-mail</label>
                <input
                  type="email"
                  required
                  value={emailConfig.user}
                  onChange={(e) => setEmailConfig({ ...emailConfig, user: e.target.value })}
                  placeholder="seuemail@gmail.com"
                  className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300">Senha de Aplicativo (App Password)</label>
                <input
                  type="password"
                  required
                  value={emailConfig.pass}
                  onChange={(e) => setEmailConfig({ ...emailConfig, pass: e.target.value })}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  💡 No Gmail: Conta Google → Segurança → Senhas de app.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  Salvar e Sincronizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Upload Manual */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-500" /> Upload de Comprovante Avulso
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Envie uma fatura antiga ou comprovante em PDF para mantê-lo organizado na pasta.
            </p>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-300">Arquivo PDF</label>
                <input
                  type="file"
                  required
                  accept="application/pdf"
                  onChange={(e) => setUploadData({ ...uploadData, file: e.target.files ? e.target.files[0] : null })}
                  className="w-full mt-1 text-xs text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300">Concessionária</label>
                <select
                  value={uploadData.provider}
                  onChange={(e) => setUploadData({ ...uploadData, provider: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="CPFL">CPFL Energia (Luz)</option>
                  <option value="SABESP">Sabesp (Água)</option>
                  <option value="VIVO">Vivo (Internet)</option>
                  <option value="OUTROS">Outros</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-zinc-300">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 145.50"
                    value={uploadData.amount}
                    onChange={(e) => setUploadData({ ...uploadData, amount: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-300">Mês Ref. (MM/AAAA)</label>
                  <input
                    type="text"
                    placeholder="Ex: 10/2026"
                    value={uploadData.referenceMonth}
                    onChange={(e) => setUploadData({ ...uploadData, referenceMonth: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                >
                  Salvar Comprovante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
