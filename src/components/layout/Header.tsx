import React, { useState, useRef } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { Calendar, User, Check, Edit3, X, Upload, Camera, Settings, Moon, Sun, RotateCw, ShoppingCart } from 'lucide-react';
import { ConfiguracoesBaseModal } from '../configuracoes/ConfiguracoesBaseModal';
import { SincronizarMercadoModal } from '../mercado/SincronizarMercadoModal';
import type { SecaoAtiva } from './Sidebar';

interface HeaderProps {
  secaoAtiva: SecaoAtiva;
  onSelecionarSecao: (secao: SecaoAtiva) => void;
}

const AVATARES_PREDEFINIDOS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
];

export const Header: React.FC<HeaderProps> = () => {
  const { competenciaAtiva, setCompetenciaAtiva, usuario, setUsuario, tema, alternarTema, sincronizarComNuvem, sincronizandoNuvem } = useFinanceStore();
  const [modalPerfilAberto, setModalPerfilAberto] = useState(false);
  const [modalConfigAberto, setModalConfigAberto] = useState(false);
  const [modalMercadoAberto, setModalMercadoAberto] = useState(false);
  const [abaConfigInicial, setAbaConfigInicial] = useState<'cartoes' | 'categorias' | 'banco'>('banco');
  const [nomeTemp, setNomeTemp] = useState(usuario.nome);
  const [tituloTemp, setTituloTemp] = useState(usuario.titulo);
  const [avatarTemp, setAvatarTemp] = useState(usuario.avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCorBanco = (banco: string) => {
    const b = (banco || '').toLowerCase();
    if (b.includes('brasil')) return '#F8D117';
    if (b.includes('bradesco')) return '#CC092F';
    if (b.includes('nubank')) return '#C084FC';
    if (b.includes('itaú') || b.includes('itau')) return '#EC7000';
    if (b.includes('caixa')) return '#0066B3';
    if (b.includes('santander')) return '#FF4D4D';
    if (b.includes('inter')) return '#FF7A00';
    return '#F8D117';
  };

  const corBanco = getCorBanco(usuario.bancoPrincipal);

  const meses = [
    '01', '02', '03', '04', '05', '06', 
    '07', '08', '09', '10', '11', '12'
  ];
  const anoAtual = new Date().getFullYear();
  const opcoesCompetencia = [
    ...meses.map(m => `${m}/${anoAtual - 1}`),
    ...meses.map(m => `${m}/${anoAtual}`),
    ...meses.map(m => `${m}/${anoAtual + 1}`)
  ];

  const handleArquivoFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Por favor, selecione uma imagem de até 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarTemp(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const salvarPerfil = (e: React.FormEvent) => {
    e.preventDefault();
    setUsuario({ nome: nomeTemp, titulo: tituloTemp, avatarUrl: avatarTemp });
    setModalPerfilAberto(false);
  };

  return (
    <div style={{ width: '100%', marginBottom: '16px' }}>
      {/* Cabeçalho Proporcional, Compacto e Equilibrado (Sem abas no topo) */}
      <header style={{
        position: 'relative',
        padding: '12px 18px',
        background: 'linear-gradient(135deg, #173F5F 0%, #205B7D 60%, #287EA5 100%)',
        borderRadius: '0 0 20px 20px',
        boxShadow: '0 6px 20px rgba(23, 63, 95, 0.25)',
        overflow: 'hidden',
        color: '#FFFFFF'
      }}>
        {/* Esferas decorativas sutis */}
        <div style={{
          position: 'absolute',
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          right: '-20px',
          top: '-30px',
          pointerEvents: 'none'
        }} />

        {/* Container Principal do Header Responsivo (Zero Encavalamento) */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* Linha 1: Perfil do Titular (Esquerda) e Seleção do Mês de Movimento (Direita) */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            width: '100%'
          }}>
            {/* Lado Esquerdo: Perfil do Titular */}
            <div 
              onClick={() => {
                setNomeTemp(usuario.nome);
                setTituloTemp(usuario.titulo);
                setAvatarTemp(usuario.avatarUrl);
                setModalPerfilAberto(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '4px 10px 4px 4px',
                borderRadius: '25px',
                backgroundColor: 'rgba(11, 25, 41, 0.45)',
                border: '1px solid rgba(248, 209, 23, 0.35)',
                transition: 'transform 0.15s ease',
                flex: '1 1 auto',
                minWidth: 0
              }}
              title="Clique para editar sua foto e nome"
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img
                  src={usuario.avatarUrl}
                  alt={usuario.nome}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #F8D117',
                    display: 'block'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '9px',
                  height: '9px',
                  backgroundColor: '#4CAF50',
                  borderRadius: '50%',
                  border: '1.5px solid #0F2744'
                }} />
              </div>

              <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ 
                    fontSize: 'clamp(12px, 3.4vw, 14.5px)', 
                    fontWeight: 800, 
                    color: '#FFFFFF',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {usuario.nome}
                  </span>
                  <Edit3 size={12} color="#F8D117" opacity={0.8} style={{ flexShrink: 0 }} />
                </div>
                <span style={{ 
                  fontSize: '10.5px', 
                  color: '#F8D117', 
                  fontWeight: 700, 
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {usuario.titulo}
                </span>
              </div>
            </div>

            {/* Lado Direito: Seleção do Mês de Movimento */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: 'rgba(11, 25, 41, 0.55)',
              backdropFilter: 'blur(8px)',
              padding: '6px 10px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              flexShrink: 0
            }}>
              <Calendar size={14} color="#5090D3" style={{ flexShrink: 0 }} />
              <select
                value={competenciaAtiva}
                onChange={(e) => setCompetenciaAtiva(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  fontSize: '12.5px',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'auto'
                }}
              >
                {opcoesCompetencia.map((comp) => (
                  <option key={comp} value={comp} style={{ background: '#0F2744', color: '#FFFFFF' }}>
                    {comp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Linha 2: BANCO DO BRASIL • MEU FINANCEIRO PRO (Esquerda) + Luazinha/Sol e Engrenagem (Direita) */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
            width: '100%'
          }}>
            {/* Banco Principal e Meu Financeiro PRO */}
            <div 
              onClick={() => {
                setAbaConfigInicial('banco');
                setModalConfigAberto(true);
              }}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: '20px',
                backgroundColor: 'rgba(11, 25, 41, 0.45)',
                border: `1.5px solid ${corBanco}60`,
                boxShadow: `0 2px 10px rgba(0, 0, 0, 0.2), 0 0 10px ${corBanco}20`,
                transition: 'all 0.15s ease',
                minWidth: 0,
                flex: '1 1 auto',
                overflow: 'hidden'
              }}
              title="Clique para alternar o Banco Principal do cabeçalho"
            >
              <span style={{ fontSize: '12px', flexShrink: 0 }}>🏛️</span>
              <span style={{
                fontSize: '11px',
                fontWeight: 900,
                letterSpacing: '0.6px',
                color: corBanco,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {usuario.bancoPrincipal || 'BANCO DO BRASIL'}
              </span>
              <span style={{ fontSize: '9px', color: corBanco, opacity: 0.9, flexShrink: 0 }}>▼</span>
              <span className="separador-pro" style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '10px', flexShrink: 0 }}>•</span>
              <span className="texto-pro-badge" style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                color: '#E7EBF0', 
                letterSpacing: '-0.2px',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}>
                MEU FINANCEIRO PRO
              </span>
            </div>

            {/* Ações: Luazinha/Sol (Cor de Fundo) e Engrenagem (Configurações) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              {/* Botão de Alternância de Tema (Luazinha / Sol) */}
              <button
                type="button"
                onClick={alternarTema}
                title={tema === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(11, 25, 41, 0.55)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: tema === 'dark' ? '#F8D117' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'transform 0.15s ease'
                }}
              >
                {tema === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
              </button>

              {/* Botão da Engrenagem (Configurações da Base de Dados) */}
              <button
                type="button"
                onClick={() => {
                  setAbaConfigInicial('cartoes');
                  setModalConfigAberto(true);
                }}
                title="Configurações & Base de Dados (Cartões, Limites, Categorias)"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(11, 25, 41, 0.55)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#F8D117',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'transform 0.15s ease'
                }}
              >
                <Settings size={15} />
              </button>
            </div>
          </div>

          {/* Linha 3: Sincronização da Nuvem (Esquerda) e Sincronizar Meu Mercado (Direita) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            width: '100%',
            paddingTop: '2px'
          }}>
            {/* Botão Esquerda: Sincronizar Nuvem */}
            <button 
              type="button"
              onClick={() => sincronizarComNuvem()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                cursor: 'pointer',
                padding: '7px 8px',
                borderRadius: '16px',
                backgroundColor: sincronizandoNuvem ? 'rgba(40, 126, 165, 0.5)' : 'rgba(11, 25, 41, 0.65)',
                border: '1.5px solid rgba(76, 175, 80, 0.6)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                transition: 'all 0.15s ease',
                color: '#FFFFFF',
                width: '100%',
                minWidth: 0
              }}
              title="Clique para sincronizar todos os dados entre PC e Celular agora"
            >
              <RotateCw size={12} color="#4CAF50" className={sincronizandoNuvem ? 'animate-spin' : ''} style={{ flexShrink: 0 }} />
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 800, 
                color: '#FFFFFF',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {sincronizandoNuvem ? 'Nuvem...' : 'Sincronizar Nuvem'}
              </span>
              <span style={{
                fontSize: '8px',
                fontWeight: 900,
                padding: '1px 5px',
                borderRadius: '6px',
                backgroundColor: 'rgba(76, 175, 80, 0.25)',
                color: '#4CAF50',
                border: '1px solid #4CAF50',
                flexShrink: 0
              }}>
                100%
              </span>
            </button>

            {/* Botão Direita: Sincronizar Meu Mercado */}
            <button 
              type="button"
              onClick={() => setModalMercadoAberto(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                cursor: 'pointer',
                padding: '7px 8px',
                borderRadius: '16px',
                backgroundColor: 'rgba(11, 25, 41, 0.65)',
                border: '1.5px solid rgba(80, 144, 211, 0.6)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                transition: 'all 0.15s ease',
                color: '#FFFFFF',
                width: '100%',
                minWidth: 0
              }}
              title="Sincronizar compras e recibos do Meu Mercado"
            >
              <ShoppingCart size={12} color="#5090D3" style={{ flexShrink: 0 }} />
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 800, 
                color: '#FFFFFF',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Meu Mercado
              </span>
              <span style={{
                fontSize: '8px',
                fontWeight: 900,
                padding: '1px 5px',
                borderRadius: '6px',
                backgroundColor: 'rgba(80, 144, 211, 0.25)',
                color: '#5090D3',
                border: '1px solid #5090D3',
                flexShrink: 0
              }}>
                CONECTAR
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Modal para Editar Perfil (Nome, Cargo e Foto com Upload do Dispositivo) */}
      {modalPerfilAberto && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={20} color="#F8D117" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Editar Perfil do Titular</h3>
              </div>
              <button onClick={() => setModalPerfilAberto(false)} style={{ color: 'var(--text-tertiary)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={salvarPerfil} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Seção de Troca de Foto */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                borderRadius: '14px',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={avatarTemp}
                    alt="Preview"
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #F8D117',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#287EA5',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #0F2744',
                      cursor: 'pointer'
                    }}
                    title="Carregar nova foto"
                  >
                    <Camera size={12} />
                  </button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleArquivoFoto}
                  accept="image/*"
                  style={{ display: 'none' }}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary"
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    gap: '6px'
                  }}
                >
                  <Upload size={13} />
                  <span>Escolher Foto do Computador / Celular</span>
                </button>

                {/* Galeria de Fotos Rápidas */}
                <div style={{ width: '100%', marginTop: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#AAB4BE', display: 'block', marginBottom: '6px', textAlign: 'center' }}>
                    Ou selecione um avatar rápido:
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    {AVATARES_PREDEFINIDOS.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Avatar ${idx}`}
                        onClick={() => setAvatarTemp(url)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          cursor: 'pointer',
                          border: avatarTemp === url ? '2px solid #F8D117' : '1px solid #1E3A5F',
                          opacity: avatarTemp === url ? 1 : 0.65,
                          transition: 'all 0.15s ease'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Nome do Titular */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  NOME DO TITULAR
                </label>
                <input
                  type="text"
                  value={nomeTemp}
                  onChange={(e) => setNomeTemp(e.target.value)}
                  placeholder="Seu nome ou Dr. Isaac"
                  style={{ fontSize: '14px', fontWeight: 700 }}
                  required
                />
              </div>

              {/* Título / Descrição */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  TÍTULO / DESCRIÇÃO DA CONTA
                </label>
                <input
                  type="text"
                  value={tituloTemp}
                  onChange={(e) => setTituloTemp(e.target.value)}
                  placeholder="Ex.: Titular • Conta Especial BB"
                  style={{ fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, gap: '6px' }}>
                  <Check size={16} /> Salvar Alterações
                </button>
                <button 
                  type="button" 
                  onClick={() => setModalPerfilAberto(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>

              {/* Botão de Atalho para Base de Dados */}
              <div style={{ borderTop: '1px solid #1E3A5F', paddingTop: '12px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setModalPerfilAberto(false);
                    setAbaConfigInicial('cartoes');
                    setModalConfigAberto(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(248, 209, 23, 0.1)',
                    border: '1px solid rgba(248, 209, 23, 0.3)',
                    color: '#F8D117',
                    fontWeight: 700,
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Settings size={14} />
                  <span>Gerenciar Cartões, Categorias & Banco</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Completo de Configurações e Base de Dados */}
      <ConfiguracoesBaseModal
        aberto={modalConfigAberto}
        onFechar={() => setModalConfigAberto(false)}
        abaInicial={abaConfigInicial}
      />

      {/* Modal de Sincronização com o Meu Mercado */}
      <SincronizarMercadoModal
        aberto={modalMercadoAberto}
        onFechar={() => setModalMercadoAberto(false)}
      />
    </div>
  );
};
