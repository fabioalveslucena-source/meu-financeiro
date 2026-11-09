import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { Search, Tag, Check, ChevronDown } from 'lucide-react';

interface SeletorCategoriaPesquisaProps {
  valor: string;
  onSelecionar: (categoriaNome: string, naturezaNome?: string) => void;
  label?: string;
  placeholder?: string;
}

export const SeletorCategoriaPesquisa: React.FC<SeletorCategoriaPesquisaProps> = ({
  valor,
  onSelecionar,
  label = 'CATEGORIA:',
  placeholder = 'Pesquisar categoria...'
}) => {
  const { categorias } = useFinanceStore();
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrar categorias com base na pesquisa
  const categoriasFiltradas = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    if (!termo) return categorias;
    return categorias.filter(
      cat => cat.nome.toLowerCase().includes(termo) || cat.natureza.toLowerCase().includes(termo)
    );
  }, [categorias, busca]);

  // Agrupar categorias por natureza
  const categoriasAgrupadas = useMemo(() => {
    const mapa: Record<string, typeof categorias> = {};
    for (const cat of categoriasFiltradas) {
      const nat = cat.natureza || 'Outros';
      if (!mapa[nat]) mapa[nat] = [];
      mapa[nat].push(cat);
    }
    return mapa;
  }, [categoriasFiltradas]);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      {label && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 800, color: '#8A99AD', marginBottom: '4px' }}>
          <Tag size={12} color="#F8D117" />
          {label}
        </label>
      )}

      {/* Botão de disparo / exibição atual */}
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        style={{
          width: '100%',
          height: '42px',
          padding: '0 12px',
          backgroundColor: '#0A1B30',
          border: aberto ? '1.5px solid #F8D117' : '1px solid #265D97',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#FFFFFF',
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {valor || 'Selecione uma categoria'}
          </span>
        </div>
        <ChevronDown size={16} color="#8A99AD" style={{ transform: aberto ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {/* Dropdown com campo de busca */}
      {aberto && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          backgroundColor: '#0F2744',
          border: '1.5px solid #1E3A5F',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          zIndex: 150,
          maxHeight: '260px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Campo de pesquisa no topo */}
          <div style={{ padding: '8px', borderBottom: '1px solid #1E3A5F', backgroundColor: '#0A1B30' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#132F4C',
              borderRadius: '8px',
              padding: '0 8px',
              height: '36px',
              border: '1px solid #265D97'
            }}>
              <Search size={14} color="#8A99AD" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder={placeholder}
                autoFocus
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca('')}
                  style={{ background: 'none', border: 'none', color: '#8A99AD', cursor: 'pointer', padding: 0, fontSize: '11px' }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Lista agrupada com rolagem */}
          <div style={{ overflowY: 'auto', padding: '6px' }}>
            {Object.keys(categoriasAgrupadas).length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#8A99AD' }}>
                Nenhuma categoria encontrada para "{busca}".
              </div>
            ) : (
              Object.entries(categoriasAgrupadas).map(([natureza, cats]) => (
                <div key={natureza} style={{ marginBottom: '8px' }}>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: '#F8D117',
                    textTransform: 'uppercase',
                    padding: '4px 8px',
                    letterSpacing: '0.5px'
                  }}>
                    {natureza}
                  </div>
                  {cats.map((cat) => {
                    const selecionado = cat.nome.toLowerCase() === valor.toLowerCase();
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          onSelecionar(cat.nome, cat.natureza);
                          setAberto(false);
                          setBusca('');
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          backgroundColor: selecionado ? 'rgba(76, 175, 80, 0.2)' : 'transparent',
                          border: selecionado ? '1px solid rgba(76, 175, 80, 0.4)' : 'none',
                          color: selecionado ? '#81C784' : '#CBD5E1',
                          fontSize: '12px',
                          fontWeight: selecionado ? 800 : 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '2px'
                        }}
                      >
                        <span>{cat.nome}</span>
                        {selecionado && <Check size={14} color="#4CAF50" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
