import React, { useState } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { 
  X, 
  ShoppingCart, 
  RefreshCw, 
  CheckCircle2, 
  Link, 
  Sparkles, 
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
    if (!urlApp.trim()) {
      alert('Por favor, informe a URL da WebApp do seu Meu Mercado (ou teste a simulação abaixo).');
      return;
    }

    try {
      setCarregando(true);
      setMensagemStatus('Conectando ao Meu Mercado...');

      const urlFinal = urlApp.includes('?') ? `${urlApp}&api=extrato` : `${urlApp}?api=extrato`;
      const res = await fetch(urlFinal);
      const json = await res.json();

      if (!json || !json.sucesso || !Array.isArray(json.compras)) {
        throw new Error(json.erro || 'Formato de resposta inválido.');
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
      mostrarToast(`🛒 ${importadas} compras do Meu Mercado atualizadas!`, 'sucesso');
    } catch (err: any) {
      console.error('Erro ao sincronizar com Meu Mercado:', err);
      setMensagemStatus(`⚠️ Não foi possível sincronizar diretamente: ${err.message || 'Verifique a URL'}`);
    } finally {
      setCarregando(false);
    }
  };

  const handleSimularCompra = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');

    adicionarCompraMercado({
      mercadoNome: 'Meu Mercado (Compra do Dia)',
      data: `${ano}-${mes}-${dia}`,
      valorTotal: 650.00,
      formaPagamento: '💳 Crédito',
      cartao: 'Banco do Brasil Ourocard',
      itens: [
        { nome: 'Tomate Italiano Selecionado', quantidade: 2.5, unidade: 'kg', precoUnitario: 8.50, precoTotal: 21.25, categoriaItem: 'Hortifruti' },
        { nome: 'Achocolatado Toddy 800g', quantidade: 2, unidade: 'un', precoUnitario: 18.90, precoTotal: 37.80, categoriaItem: 'Mercearia' },
        { nome: 'Arroz Branco Nobre 5kg', quantidade: 3, unidade: 'pct', precoUnitario: 31.90, precoTotal: 95.70, categoriaItem: 'Mercearia' },
        { nome: 'Feijão Carioca Tipo 1 1kg', quantidade: 4, unidade: 'pct', precoUnitario: 8.20, precoTotal: 32.80, categoriaItem: 'Mercearia' },
        { nome: 'Carnes de Primeira (Alcatra / Patinho)', quantidade: 5.2, unidade: 'kg', precoUnitario: 42.50, precoTotal: 221.00, categoriaItem: 'Açougue' },
        { nome: 'Hortifruti, Laticínios e Limpeza Geral', quantidade: 1, unidade: 'kit', precoUnitario: 241.45, precoTotal: 241.45, categoriaItem: 'Diversos' },
      ]
    });
    setMensagemStatus('✅ Compra teste de R$ 650,00 enviada para o extrato com 6 produtos!');
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
              <span style={{ fontSize: '11px', color: '#E7EBF0', opacity: 0.85 }}>
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
            fontSize: '12px',
            color: '#E7EBF0',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#66BB6A' }}>
              <CheckCircle2 size={14} />
              <span>Conexão Pronta e Integrada</span>
            </div>
            <p style={{ margin: 0, color: '#AAB4BE', lineHeight: 1.4 }}>
              As compras finalizadas no seu aplicativo <strong>Meu Mercado</strong> podem ser sincronizadas com um toque, trazendo a despesa consolidada e o <strong>cupom com todos os produtos</strong> (tomate, toddy, feijão, arroz, etc.).
            </p>
          </div>

          {/* Campo de URL da WebApp do Meu Mercado */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
              <Link size={12} color="#5090D3" />
              <span>URL da WebApp do Meu Mercado (Opcional para conexão direta)</span>
            </label>
            <input 
              type="text"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={urlApp}
              onChange={(e) => salvarUrl(e.target.value)}
              style={{ fontSize: '12px' }}
            />
          </div>

          {mensagemStatus && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: mensagemStatus.startsWith('✅') ? 'rgba(76, 175, 80, 0.18)' : 'rgba(255, 152, 0, 0.18)',
              border: `1px solid ${mensagemStatus.startsWith('✅') ? '#4CAF50' : '#FF9800'}`,
              fontSize: '11.5px',
              fontWeight: 600,
              color: mensagemStatus.startsWith('✅') ? '#66BB6A' : '#F8D117'
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
                padding: '10px',
                fontSize: '12.5px',
                gap: '8px'
              }}
            >
              <RefreshCw size={15} className={carregando ? 'animate-spin' : ''} />
              <span>{carregando ? 'Sincronizando...' : 'Buscar Compras do Meu Mercado'}</span>
            </button>

            <button
              type="button"
              onClick={handleSimularCompra}
              className="btn-secondary"
              style={{
                width: '100%',
                padding: '9px',
                fontSize: '12px',
                borderColor: '#287EA5',
                color: '#F8D117',
                gap: '6px'
              }}
            >
              <Sparkles size={14} color="#F8D117" />
              <span>Gerar / Atualizar Compra Teste (R$ 650,00)</span>
            </button>

            {comprasMercadoAtuais.length > 0 && (
              <button
                type="button"
                onClick={handleLimparComprasMercado}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#EF5350',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  marginTop: '4px'
                }}
              >
                <Trash2 size={12} />
                <span>Limpar compras do Meu Mercado ({comprasMercadoAtuais.length} ativas)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
