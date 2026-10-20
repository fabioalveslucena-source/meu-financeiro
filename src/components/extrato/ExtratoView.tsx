import React, { useState } from 'react';
import { LivroCaixaView } from '../livro-caixa/LivroCaixaView';
import { GerenciamentoView } from '../gerenciamento/GerenciamentoView';
import { RecorrentesView } from '../recorrentes/RecorrentesView';
import { ImportarExtratoModal } from './ImportarExtratoModal';
import { SincronizarMercadoModal } from '../mercado/SincronizarMercadoModal';
import { BookOpen, Search, Repeat, UploadCloud, ShoppingCart } from 'lucide-react';

interface ExtratoViewProps {
  subAbaInicial?: 'livro-caixa' | 'gerenciar' | 'recorrentes';
}

export const ExtratoView: React.FC<ExtratoViewProps> = ({ subAbaInicial = 'livro-caixa' }) => {
  const [subAba, setSubAba] = useState<'livro-caixa' | 'gerenciar' | 'recorrentes'>(subAbaInicial);
  const [modalImportarAberto, setModalImportarAberto] = useState(false);
  const [modalMercadoAberto, setModalMercadoAberto] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Barra de Ações Rápidas: Sub-Abas e Importar Extrato */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {/* Seletor Segmentado de 3 Sub-Abas com 100% de Largura */}
        <div style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '4px',
          backgroundColor: '#0F2744',
          borderRadius: '14px',
          border: '1px solid #1E3A5F',
          gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => setSubAba('livro-caixa')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '8px 4px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: subAba === 'livro-caixa' ? '#173F5F' : 'transparent',
              color: subAba === 'livro-caixa' ? '#F8D117' : '#AAB4BE',
              fontWeight: subAba === 'livro-caixa' ? 800 : 600,
              fontSize: 'clamp(10.5px, 3vw, 12.5px)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <BookOpen size={14} style={{ flexShrink: 0 }} />
            <span>Extrato & PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setSubAba('gerenciar')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '8px 4px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: subAba === 'gerenciar' ? '#173F5F' : 'transparent',
              color: subAba === 'gerenciar' ? '#F8D117' : '#AAB4BE',
              fontWeight: subAba === 'gerenciar' ? 800 : 600,
              fontSize: 'clamp(10.5px, 3vw, 12.5px)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Search size={14} style={{ flexShrink: 0 }} />
            <span>Gerenciar</span>
          </button>

          <button
            type="button"
            onClick={() => setSubAba('recorrentes')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '8px 4px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: subAba === 'recorrentes' ? '#173F5F' : 'transparent',
              color: subAba === 'recorrentes' ? '#F8D117' : '#AAB4BE',
              fontWeight: subAba === 'recorrentes' ? 800 : 600,
              fontSize: 'clamp(10.5px, 3vw, 12.5px)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Repeat size={14} style={{ flexShrink: 0 }} />
            <span>Contas Fixas</span>
          </button>
        </div>

        {/* Barra de Ações Rápidas: Sincronizar Mercado e Importar OFX/CSV */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', width: '100%' }}>
          <button
            type="button"
            onClick={() => setModalMercadoAberto(true)}
            className="btn-secondary"
            style={{
              padding: '7px 12px',
              fontSize: '11.5px',
              fontWeight: 700,
              gap: '6px',
              borderRadius: '10px',
              borderColor: '#4CAF50',
              color: '#66BB6A',
              backgroundColor: 'rgba(76, 175, 80, 0.12)'
            }}
            title="Sincronizar compras e recibos do Meu Mercado"
          >
            <ShoppingCart size={14} color="#66BB6A" />
            <span>Sincronizar Meu Mercado</span>
          </button>

          <button
            type="button"
            onClick={() => setModalImportarAberto(true)}
            className="btn-secondary"
            style={{
              padding: '7px 12px',
              fontSize: '11.5px',
              fontWeight: 700,
              gap: '6px',
              borderRadius: '10px',
              borderColor: '#287EA5',
              color: '#82B1FF'
            }}
            title="Importar extrato baixado do internet banking (.OFX ou .CSV)"
          >
            <UploadCloud size={15} color="#5090D3" />
            <span>Importar Extrato OFX / CSV</span>
          </button>
        </div>
      </div>

      {/* Conteúdo da Sub-Aba Ativa */}
      {subAba === 'livro-caixa' && <LivroCaixaView />}
      {subAba === 'gerenciar' && <GerenciamentoView />}
      {subAba === 'recorrentes' && <RecorrentesView />}

      {/* Modal de Importação de Extrato */}
      <ImportarExtratoModal
        aberto={modalImportarAberto}
        onFechar={() => setModalImportarAberto(false)}
      />

      {/* Modal de Sincronização do Meu Mercado */}
      <SincronizarMercadoModal
        aberto={modalMercadoAberto}
        onFechar={() => setModalMercadoAberto(false)}
      />
    </div>
  );
};
