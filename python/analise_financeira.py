"""
Módulo de Análise Financeira Avançada em Python
Sistema "Meu Financeiro"
Substitui as rotinas lentas procedurais do Google Apps Script com análise vetorizada (Pandas / NumPy).
"""

import json
from datetime import datetime, date
from typing import Dict, List, Any
import pandas as pd
import numpy as np

class AnalisadorFinanceiro:
    def __init__(self, lancamentos: List[Dict[str, Any]]):
        self.raw_data = lancamentos
        self.df = self._processar_dataframe(lancamentos)

    def _processar_dataframe(self, lancamentos: List[Dict[str, Any]]) -> pd.DataFrame:
        if not lancamentos:
            return pd.DataFrame()

        df = pd.DataFrame(lancamentos)
        if 'data' in df.columns:
            df['data'] = pd.to_datetime(df['data'])
        if 'valor' in df.columns:
            df['valor'] = pd.to_numeric(df['valor'], errors='coerce').fillna(0.0)
        return df

    def calcular_metricas_competencia(self, competencia: str) -> Dict[str, Any]:
        """Calcula totais, taxas de poupança e fluxo de caixa da competência."""
        if self.df.empty:
            return {"erro": "Nenhum dado disponível."}

        df_mes = self.df[self.df['competencia'] == competencia]
        if df_mes.empty:
            return {"competencia": competencia, "aviso": "Sem movimentações para este mês."}

        receitas = df_mes[df_mes['tipo'] == 'Receita']['valor'].sum()
        despesas = df_mes[df_mes['tipo'] == 'Despesa']['valor'].sum()
        investimentos = df_mes[df_mes['tipo'] == 'Investimento']['valor'].sum()

        saldo_liquido = receitas - despesas
        taxa_poupanca = (investimentos / receitas * 100) if receitas > 0 else 0.0

        # Dias corridos do mês para média diária
        hoje = datetime.now()
        dia_atual = max(1, hoje.day)
        media_diaria_despesa = despesas / dia_atual
        projecao_fechamento = media_diaria_despesa * 30.0

        # Distribuição por natureza
        naturezas = (
            df_mes[df_mes['tipo'] == 'Despesa']
            .groupby('natureza')['valor']
            .sum()
            .sort_values(ascending=False)
            .to_dict()
        )

        # Distribuição por forma de pagamento
        pagamentos = (
            df_mes
            .groupby('pagamento')['valor']
            .sum()
            .sort_values(ascending=False)
            .to_dict()
        )

        return {
            "competencia": competencia,
            "total_receitas": round(float(receitas), 2),
            "total_despesas": round(float(despesas), 2),
            "total_investimentos": round(float(investimentos), 2),
            "saldo_liquido": round(float(saldo_liquido), 2),
            "taxa_poupanca_percentual": round(float(taxa_poupanca), 2),
            "media_diaria_gasto": round(float(media_diaria_despesa), 2),
            "projecao_despesa_mes": round(float(projecao_fechamento), 2),
            "distribuicao_naturezas": {k: round(float(v), 2) for k, v in naturezas.items()},
            "distribuicao_pagamentos": {k: round(float(v), 2) for k, v in pagamentos.items()},
        }

    def gerar_relatorio_texto(self, competencia: str) -> str:
        """Gera resumo executivo formatado."""
        m = self.calcular_metricas_competencia(competencia)
        if "erro" in m or "aviso" in m:
            return f"Relatório de {competencia}: {m.get('erro') or m.get('aviso')}"

        relatorio = [
            f"==================================================",
            f"       RELATÓRIO FINANCEIRO • {competencia}",
            f"==================================================",
            f"🟢 Receitas Totais:       R$ {m['total_receitas']:,.2f}",
            f"🔴 Despesas Totais:       R$ {m['total_despesas']:,.2f}",
            f"🔵 Investimentos:         R$ {m['total_investimentos']:,.2f}",
            f"--------------------------------------------------",
            f"💰 Saldo Líquido do Mês:  R$ {m['saldo_liquido']:,.2f}",
            f"📈 Taxa de Aporte:        {m['taxa_poupanca_percentual']}%",
            f"📊 Média Diária de Gasto: R$ {m['media_diaria_gasto']:,.2f}",
            f"🔮 Projeção Fim do Mês:   R$ {m['projecao_despesa_mes']:,.2f}",
            f"==================================================",
            f"TOP GASTOS POR NATUREZA:",
        ]

        for nat, val in list(m['distribuicao_naturezas'].items())[:5]:
            relatorio.append(f"  • {nat:25}: R$ {val:,.2f}")

        relatorio.append(f"==================================================")
        return "\n".join(relatorio)

if __name__ == "__main__":
    # Teste de execução rápida com dados sintéticos
    exemplo = [
        {"data": "2026-10-01", "competencia": "10/2026", "tipo": "Receita", "natureza": "💰 Impostos", "categoria": "Salário", "valor": 12500.0, "pagamento": "📱 Pix"},
        {"data": "2026-10-02", "competencia": "10/2026", "tipo": "Despesa", "natureza": "🏠 Moradia", "categoria": "Aluguel", "valor": 2600.0, "pagamento": "📱 Pix"},
        {"data": "2026-10-05", "competencia": "10/2026", "tipo": "Despesa", "natureza": "🛒 Alimentação", "categoria": "Supermercado", "valor": 850.0, "pagamento": "💳 Crédito"},
        {"data": "2026-10-06", "competencia": "10/2026", "tipo": "Investimento", "natureza": "📦 Outros", "categoria": "Tesouro", "valor": 2000.0, "pagamento": "📱 Pix"},
    ]
    analisador = AnalisadorFinanceiro(exemplo)
    print(analisador.gerar_relatorio_texto("10/2026"))
