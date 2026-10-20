import React, { useState } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { 
  X, 
  ShoppingCart, 
  RefreshCw, 
  CheckCircle2, 
  Link, 
  HelpCircle,
  Trash2
} from 'lucide-react';

interface SincronizarMercadoModalProps {
  aberto: boolean;
  onFechar: () => void;
}

const STORAGE_KEY_URL_MERCADO = 'mf_url_meu_mercado_v1';

export const SincronizarMercadoModal: React.FC<SincronizarMercadoModalProps> = ({
  aberto,
  onFechar,
}) => {
  const { adicionarCompraMercado, lancamentos, excluirLancamento, mostrarToast } = useFinanceStore();

  const [urlApp, setUrlApp] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_URL_MERCADO) || '';
  });
  const [carregando, setCarregando] = useState(false);
  const [mensagemStatus, setMensagemStatus] = useState<string | null>(null);

  if (!aberto) return null;

  const salvarUrl = (novaUrl: string) => {
    setUrlApp(novaUrl);
    localStorage.setItem(STORAGE_KEY_URL_MERCADO, novaUrl);
  };

  const handleSincronizarWeb = async () => {
    const urlLimpa = urlApp.trim();
    if (!urlLimpa) {
      setMensagemStatus('⚠️ Por favor, cole a URL da WebApp do seu Meu Mercado no campo abaixo para sincronizar.');
      mostrarToast('Informe a URL da WebApp do Meu Mercado.', 'erro');
      return;
    }

    try {
      setCarregando(true);
      setMensagemStatus('🔄 Conectando ao Meu Mercado...');

      const urlFinal = urlLimpa.includes('?') ? `${urlLimpa}&api=extrato` : `${urlLimpa}?api=extrato`;
      const res = await fetch(urlFinal);
      const json = await res.json();

      if (!json || !json.sucesso || !Array.isArray(json.compras)) {
        throw new Error(json.erro || 'Formato de resposta inesperado do Google Apps Script.');
      }

      if (json.compras.length === 0) {
        setMensagemStatus('ℹ️ Nenhuma compra finalizada encontrada no Meu Mercado no momento.');
        mostrarToast('Nenhuma compra para importar do Meu Mercado.', 'info');
        return;
      }

      let importadas = 0;
      json.compras.forEach((compra: any) => {
        adicionarCompraMercado({
          mercadoNome: compra.nomeLista || 'Meu Mercado',
          data: compra.data,
          valorTotal: compra.valorTotal,
          formaPagamento: '💳 Crédito',
          itens: compra.itens || []
        });
        importadas++;
      });

      setMensagemStatus(`✅ ${importadas} compra(s) sincronizada(s) com sucesso!`);
      mostrarToast(`🛒 ${importadas} compra(s) do Meu Mercado integradas ao extrato!`, 'sucesso');
    } catch (err: any) {
      console.error('Erro ao sincronizar com Meu Mercado:', err);
      setMensagemStatus(`⚠️ Não foi possível sincronizar: ${err.message || 'Verifique a URL e se a implantação está acessível a Qualquer Pessoa.'}`);
    } finally {
      setCarregando(false);
    }
  };

  const comprasMercadoAtuais = lancamentos.filter(l => l.origem === 'meu-mercado' || l.detalhesMercado);

  const handleLimparComprasMercado = () => {
    if (confirm('Deseja remover todas as compras importadas do Meu Mercado?')) {
      comprasMercadoAtuais.forEach(c => excluirLancamento(c.id, false));
      setMensagemStatus('🧹 Todas as compras do Meu Mercado foram removidas do extrato.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 12, 22, 0.78)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div 
        className="card"
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#0F2744',
          borderRadius: '20px',
          border: '1.5px solid #287EA5',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {/* Cabeçalho */}
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #173F5F 0%, #205B7D 60%, #287EA5 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#FFFFFF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShoppingCart size={20} color="#F8D117" />
            </div>
            <div>
              <h3 style={{ fontSize: '15.5px', fontWeight: 800, margin: 0 }}>
                Sincronizar Meu Mercado
              </h3>
              <span style={{ fontSize: '11.5px', color: '#E7EBF0', opacity: 0.85 }}>
                Integração automática com o seu extrato de compras
              </span>
            </div>
          </div>

          <button
            onClick={onFechar}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              border: 'none',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Conteúdo */}
        <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div style={{
            padding: '12px 14px',
            backgroundColor: '#132F4C',
            borderRadius: '12px',
            border: '1px solid #1E3A5F',
            fontSize: '12.5px',
            color: '#E7EBF0',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#66BB6A' }}>
              <CheckCircle2 size={15} />
              <span>Conexão Direta com Meu Mercado</span>
            </div>
            <p style={{ margin: 0, color: '#AAB4BE', lineHeight: 1.45, fontSize: '12px' }}>
              Ao sincronizar, suas listas finalizadas no <strong>Meu Mercado</strong> são importadas automaticamente para o seu extrato com o <strong>cupom detalhado</strong> (itens, quantidades e valores).
            </p>
          </div>

          {/* Guia de instruções amigável */}
          <div style={{
            padding: '12px 14px',
            backgroundColor: 'rgba(23, 58, 94, 0.45)',
            borderRadius: '12px',
            border: '1px solid #1E3A5F',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#5090D3', fontSize: '12px' }}>
              <HelpCircle size={15} />
              <span>Onde encontrar a URL da WebApp no Meu Mercado:</span>
            </div>
            <ol style={{ margin: 0, paddingLeft: '18px', color: '#AAB4BE', lineHeight: 1.5, fontSize: '11.5px' }}>
              <li>Abra sua planilha do <strong>Meu Mercado</strong> no Google Planilhas.</li>
              <li>No menu superior, vá em <strong>Extensões</strong> &gt; <strong>Apps Script</strong>.</li>
              <li>No canto superior direito, clique em <strong>Implantar</strong> &gt; <strong>Gerenciar implantações</strong>.</li>
              <li>Copie a <strong>URL do app da Web</strong> (terminada em <code>/exec</code>) e cole no campo abaixo.</li>
            </ol>
            <span style={{ fontSize: '11px', color: '#66BB6A', fontWeight: 600, marginTop: '2px' }}>
              💡 Fica salva no aparelho automaticamente — só precisa colar uma única vez!
            </span>
          </div>

          {/* Campo de URL da WebApp do Meu Mercado */}
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
              <Link size={13} color="#5090D3" />
              <span>URL da WebApp do Meu Mercado</span>
            </label>
            <input 
              type="text"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={urlApp}
              onChange={(e) => salvarUrl(e.target.value)}
              style={{ fontSize: '12.5px', padding: '10px 12px' }}
            />
          </div>

          {mensagemStatus && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: mensagemStatus.startsWith('✅') ? 'rgba(76, 175, 80, 0.18)' : mensagemStatus.startsWith('ℹ️') ? 'rgba(33, 150, 243, 0.18)' : 'rgba(255, 152, 0, 0.18)',
              border: `1px solid ${mensagemStatus.startsWith('✅') ? '#4CAF50' : mensagemStatus.startsWith('ℹ️') ? '#2196F3' : '#FF9800'}`,
              fontSize: '12px',
              fontWeight: 600,
              color: mensagemStatus.startsWith('✅') ? '#66BB6A' : mensagemStatus.startsWith('ℹ️') ? '#60A5FA' : '#F8D117'
            }}>
              {mensagemStatus}
            </div>
          )}

          {/* Botões de Ação */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={handleSincronizarWeb}
              disabled={carregando}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '11px',
                fontSize: '13px',
                gap: '8px'
              }}
            >
              <RefreshCw size={16} className={carregando ? 'animate-spin' : ''} />
              <span>{carregando ? 'Sincronizando...' : 'Buscar Compras do Meu Mercado'}</span>
            </button>

            {comprasMercadoAtuais.length > 0 && (
              <button
                type="button"
                onClick={handleLimparComprasMercado}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#EF5350',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  marginTop: '4px',
                  padding: '6px'
                }}
              >
                <Trash2 size={13} />
                <span>Limpar compras do Meu Mercado ({comprasMercadoAtuais.length} ativas)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
