import React, { useState, useRef } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { parseOFX, parseCSV, type TransacaoImportada } from '../../features/import/ofxParser';
import { formatarMoeda, formatarData } from '../../lib/formatters';
import { 
  UploadCloud, 
  FileText, 
  Check, 
  X, 
  AlertCircle, 
  CheckSquare, 
  Square,
  HelpCircle
} from 'lucide-react';

interface ImportarExtratoModalProps {
  aberto: boolean;
  onFechar: () => void;
}

export const ImportarExtratoModal: React.FC<ImportarExtratoModalProps> = ({ aberto, onFechar }) => {
  const { importarLancamentosEmLote } = useFinanceStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nomeArquivo, setNomeArquivo] = useState('');
  const [transacoes, setTransacoes] = useState<TransacaoImportada[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!aberto) return null;

  const handleArquivoSelecionado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNomeArquivo(file.name);
    setCarregando(true);
    setErro(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const conteudo = event.target?.result as string;
        let parsed: TransacaoImportada[] = [];

        if (file.name.toLowerCase().endsWith('.ofx')) {
          parsed = parseOFX(conteudo);
        } else if (file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.txt')) {
          parsed = parseCSV(conteudo);
        } else {
          // Tentar primeiro OFX e se vazio tentar CSV
          parsed = parseOFX(conteudo);
          if (parsed.length === 0) parsed = parseCSV(conteudo);
        }

        if (parsed.length === 0) {
          setErro('Nenhuma transação financeira válida foi identificada no arquivo. Verifique se o formato é OFX ou CSV bancário.');
        } else {
          setTransacoes(parsed);
        }
      } catch (err) {
        console.error('Erro ao ler arquivo:', err);
        setErro('Falha ao processar o arquivo. Certifique-se de que é um extrato OFX ou CSV válido.');
      } finally {
        setCarregando(false);
      }
    };

    reader.onerror = () => {
      setErro('Erro na leitura do arquivo local.');
      setCarregando(false);
    };

    reader.readAsText(file, 'ISO-8859-1'); // Bancos brasileiros usam frequentemente ISO-8859-1 / Windows-1252
  };

  const alternarSelecao = (id: string) => {
    setTransacoes(prev => prev.map(t => t.id === id ? { ...t, selecionada: !t.selecionada } : t));
  };

  const selecionarTodos = (selecionar: boolean) => {
    setTransacoes(prev => prev.map(t => ({ ...t, selecionada: selecionar })));
  };

  const selecionadasCount = transacoes.filter(t => t.selecionada).length;

  const confirmarImportacao = () => {
    if (selecionadasCount === 0) return;
    const res = importarLancamentosEmLote(transacoes);
    if (res.sucesso) {
      onFechar();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 120,
      padding: '1rem'
    }}>
      <div className="card" style={{ maxWidth: '640px', width: '100%', padding: '1.5rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UploadCloud size={22} color="#5090D3" />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF' }}>
              Importar Extrato Bancário (OFX / CSV)
            </h3>
          </div>
          <button onClick={onFechar} style={{ color: '#AAB4BE' }}>
            <X size={20} />
          </button>
        </div>

        {/* Área de Seleção de Arquivo */}
        {transacoes.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #287EA5',
                borderRadius: '16px',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                backgroundColor: 'rgba(40, 126, 165, 0.08)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <FileText size={42} color="#5090D3" style={{ margin: '0 auto 0.75rem auto' }} />
              <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#FFFFFF' }}>
                {carregando ? 'Processando extrato...' : 'Clique ou arraste seu arquivo OFX ou CSV'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#AAB4BE' }}>
                Compatível com Banco do Brasil, Nubank, Itaú, Bradesco, Santander, Inter, Caixa, etc.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".ofx,.csv,.txt"
                onChange={handleArquivoSelecionado}
                style={{ display: 'none' }}
              />
            </div>

            {erro && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(244, 67, 54, 0.15)',
                border: '1px solid rgba(244, 67, 54, 0.4)',
                borderRadius: '10px',
                color: '#F44336',
                fontSize: '0.85rem'
              }}>
                <AlertCircle size={18} />
                <span>{erro}</span>
              </div>
            )}

            <div style={{
              backgroundColor: '#132F4C',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              fontSize: '0.8rem',
              color: '#AAB4BE',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start'
            }}>
              <HelpCircle size={16} color="#F8D117" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#E7EBF0', display: 'block', marginBottom: '2px' }}>
                  Como baixar o arquivo OFX no seu Internet Banking:
                </strong>
                Acesse o aplicativo ou site do seu banco, vá na seção de <strong>Extrato</strong>, clique em <strong>Exportar / Salvar</strong> e escolha o formato <strong>OFX (Money/Quicken)</strong> ou <strong>CSV</strong>.
              </div>
            </div>
          </div>
        ) : (
          /* Prévia das Transações Encontradas */
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
              <div>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF' }}>
                  {transacoes.length} movimentações encontradas no arquivo
                </span>
                <span style={{ fontSize: '0.8rem', color: '#AAB4BE', display: 'block' }}>
                  Arquivo: <strong>{nomeArquivo}</strong>
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => selecionarTodos(true)}
                  style={{ fontSize: '11px', color: '#5090D3', fontWeight: 700 }}
                >
                  Marcar Todas
                </button>
                <span style={{ color: '#1E3A5F' }}>|</span>
                <button
                  type="button"
                  onClick={() => selecionarTodos(false)}
                  style={{ fontSize: '11px', color: '#AAB4BE', fontWeight: 700 }}
                >
                  Desmarcar Todas
                </button>
              </div>
            </div>

            {/* Lista com Rolagem */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              maxHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              paddingRight: '4px'
            }}>
              {transacoes.map((t) => {
                const isReceita = t.tipo === 'Receita';
                return (
                  <div
                    key={t.id}
                    onClick={() => alternarSelecao(t.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      backgroundColor: t.selecionada ? 'rgba(80, 144, 211, 0.12)' : '#132F4C',
                      border: `1px solid ${t.selecionada ? '#5090D3' : '#1E3A5F'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {t.selecionada ? (
                        <CheckSquare size={18} color="#5090D3" />
                      ) : (
                        <Square size={18} color="#AAB4BE" />
                      )}

                      <div>
                        <strong style={{ fontSize: '0.9rem', color: '#FFFFFF', display: 'block' }}>
                          {t.descricao}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: '#AAB4BE' }}>
                          {formatarData(t.data)} • {t.natureza} • {t.categoria} • {t.pagamento}
                        </span>
                      </div>
                    </div>

                    <strong style={{
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: isReceita ? '#4CAF50' : '#F44336'
                    }}>
                      {isReceita ? '+ ' : '- '}
                      {formatarMoeda(t.valor)}
                    </strong>
                  </div>
                );
              })}
            </div>

            {/* Ações Inferiores */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #1E3A5F' }}>
              <button
                type="button"
                onClick={() => {
                  setTransacoes([]);
                  setNomeArquivo('');
                }}
                className="btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                Escolher Outro Arquivo
              </button>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={onFechar}
                  style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', color: '#AAB4BE', fontWeight: 600 }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarImportacao}
                  disabled={selecionadasCount === 0}
                  className="btn-primary"
                  style={{ fontSize: '0.85rem' }}
                >
                  <Check size={16} />
                  <span>Importar {selecionadasCount} Movimentações</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
