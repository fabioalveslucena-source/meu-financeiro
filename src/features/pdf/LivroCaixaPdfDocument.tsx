import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Lancamento, LivroCaixaResumo } from '../../types';
import { formatarMoeda, formatarData } from '../../lib/formatters';

const styles = StyleSheet.create({
  page: {
    padding: 34,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1A202C',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: '#287EA5',
    paddingBottom: 14,
    marginBottom: 16,
  },
  titleArea: {
    flexDirection: 'column',
    maxWidth: '70%',
  },
  brandText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#287EA5',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B1929',
  },
  titularInfo: {
    fontSize: 10,
    color: '#2D3748',
    marginTop: 4,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 8.5,
    color: '#718096',
    marginTop: 1,
  },
  competenciaBadge: {
    backgroundColor: '#0F2744',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  competenciaLabel: {
    fontSize: 7,
    color: '#AAB4BE',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  competenciaText: {
    color: '#F8D117',
    fontSize: 12,
    fontWeight: 'bold',
  },
  resumoCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  card: {
    flex: 1,
    padding: 9,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  cardLabel: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#718096',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0F2744',
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tableHeaderCol: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tableRowZebra: {
    backgroundColor: '#F8FAFC',
  },
  colData: { width: '13%' },
  colDesc: { width: '42%' },
  colNat: { width: '25%' },
  colValor: { width: '20%', textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 34,
    right: 34,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    fontSize: 7.5,
    color: '#A0AEC0',
  },
});

interface LivroCaixaPdfProps {
  resumo: LivroCaixaResumo;
  lancamentos: Lancamento[];
  nomeTitular?: string;
  banco?: string;
}

function removerEmojis(texto: string): string {
  if (!texto) return '';
  return texto
    .replace(/[^\p{L}\p{N}\s/.,_()\-:;áéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const LivroCaixaPdfDocument: React.FC<LivroCaixaPdfProps> = ({ 
  resumo, 
  lancamentos,
  nomeTitular = 'Dr. Isaac',
  banco = 'Banco do Brasil'
}) => {
  return (
    <Document title={`Extrato_Financeiro_${resumo.competencia.replace('/', '_')}_${removerEmojis(nomeTitular).replace(/\s+/g, '_')}`}>
      <Page size="A4" orientation="portrait" style={styles.page}>
        
        {/* Cabeçalho Oficial Bancário com Identificação do Titular */}
        <View style={styles.header}>
          <View style={styles.titleArea}>
            <Text style={styles.brandText}>{removerEmojis(banco).toUpperCase()} • EXTRATO BANCÁRIO OFICIAL</Text>
            <Text style={styles.title}>Extrato de Movimentações Financeiras</Text>
            <Text style={styles.titularInfo}>Titular da Conta: {nomeTitular}</Text>
          </View>

          <View style={styles.competenciaBadge}>
            <Text style={styles.competenciaLabel}>Competência</Text>
            <Text style={styles.competenciaText}>{resumo.competencia}</Text>
          </View>
        </View>

        {/* Resumo Executivo em 4 Cards Espaçosos */}
        <View style={styles.resumoCardsContainer}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Saldo Anterior</Text>
            <Text style={[styles.cardValue, { color: '#4A5568' }]}>
              {formatarMoeda(resumo.saldoAnterior)}
            </Text>
          </View>

          <View style={[styles.card, { borderLeftWidth: 3, borderLeftColor: '#2E7D32' }]}>
            <Text style={[styles.cardLabel, { color: '#2E7D32' }]}>Entradas (Receitas)</Text>
            <Text style={[styles.cardValue, { color: '#2E7D32' }]}>
              + {formatarMoeda(resumo.totalReceitas)}
            </Text>
          </View>

          <View style={[styles.card, { borderLeftWidth: 3, borderLeftColor: '#C62828' }]}>
            <Text style={[styles.cardLabel, { color: '#C62828' }]}>Saídas (Despesas)</Text>
            <Text style={[styles.cardValue, { color: '#C62828' }]}>
              - {formatarMoeda(resumo.totalDespesas)}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: '#EBF8FF', borderColor: '#287EA5', borderLeftWidth: 3, borderLeftColor: '#287EA5' }]}>
            <Text style={[styles.cardLabel, { color: '#287EA5' }]}>Saldo Final</Text>
            <Text style={[styles.cardValue, { color: '#0F2744', fontSize: 12 }]}>
              {formatarMoeda(resumo.saldoFinal)}
            </Text>
          </View>
        </View>

        {/* Tabela de Lançamentos com Espaçamento e Clareza Visual */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCol, styles.colData]}>Data</Text>
            <Text style={[styles.tableHeaderCol, styles.colDesc]}>Descrição & Forma</Text>
            <Text style={[styles.tableHeaderCol, styles.colNat]}>Natureza / Categoria</Text>
            <Text style={[styles.tableHeaderCol, styles.colValor]}>Valor (R$)</Text>
          </View>

          {lancamentos.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: '#718096', fontSize: 9 }}>
                Nenhum lançamento registrado nesta competência.
              </Text>
            </View>
          ) : (
            lancamentos.map((item, idx) => {
              const corValor = 
                item.tipo === 'Receita' ? '#2E7D32' : 
                item.tipo === 'Investimento' ? '#1565C0' : '#C62828';

              const natLimpa = removerEmojis(item.natureza);
              const pagLimpo = removerEmojis(item.pagamento);
              const detalhePagamento = item.parcela && item.totalParcelas && item.totalParcelas > 1
                ? `${pagLimpo} • Parcela ${item.parcela}/${item.totalParcelas}`
                : `${pagLimpo} • à vista`;

              return (
                <View 
                  key={item.id} 
                  style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowZebra : {}]}
                >
                  {/* Data */}
                  <Text style={[styles.colData, { fontSize: 8, color: '#4A5568' }]}>
                    {formatarData(item.data)}
                  </Text>

                  {/* Descrição e Forma */}
                  <View style={styles.colDesc}>
                    <Text style={{ fontWeight: 'bold', fontSize: 8.5, color: '#1A202C' }}>
                      {item.descricao}
                    </Text>
                    <Text style={{ fontSize: 7, color: '#718096', marginTop: 1 }}>
                      {detalhePagamento}
                      {item.cartao ? ` • ${removerEmojis(item.cartao)}` : ''}
                    </Text>
                  </View>

                  {/* Natureza / Categoria */}
                  <Text style={[styles.colNat, { color: '#4A5568', fontSize: 8 }]}>
                    {natLimpa} - {item.categoria}
                  </Text>

                  {/* Valor */}
                  <Text style={[styles.colValor, { color: corValor, fontWeight: 'bold', fontSize: 9 }]}>
                    {item.tipo === 'Despesa' ? `- ` : `+ `}
                    {formatarMoeda(item.valor)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* Rodapé Oficial */}
        <View style={styles.footer}>
          <Text>
            Meu Financeiro • Titular: {nomeTitular} • Emissão em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} fixed />
        </View>
      </Page>
    </Document>
  );
};
