"""
Script Utilitário para Migração de Dados do Google Sheets para o Firestore / JSON
"""

import json
import csv
from datetime import datetime
from typing import List, Dict

def converter_linha_sheets_para_lancamento(linha: Dict[str, str], user_id: str = "default-user") -> Dict:
    """
    Mapeia os campos das 21 colunas da aba BANCO original para o schema limpo do Firestore.
    Colunas originais: ID, Data, Tipo, Valor, Natureza, Categoria, Descrição, Pagamento, Cartão, Conta, etc.
    """
    valor_raw = linha.get('Valor') or linha.get('valor') or '0'
    valor_limpo = str(valor_raw).replace('R$', '').replace('.', '').replace(',', '.').strip()
    try:
        valor_float = float(valor_limpo)
    except ValueError:
        valor_float = 0.0

    return {
        "userId": user_id,
        "data": linha.get('Data') or datetime.now().strftime('%Y-%m-%d'),
        "competencia": linha.get('Competência') or linha.get('competencia') or datetime.now().strftime('%m/%Y'),
        "valor": valor_float,
        "tipo": linha.get('Tipo') or 'Despesa',
        "natureza": linha.get('Natureza') or '🛒 Alimentação',
        "categoria": linha.get('Categoria') or 'Supermercado',
        "descricao": (linha.get('Descrição') or linha.get('descricao') or '').strip(),
        "pagamento": linha.get('Pagamento') or '📱 Pix',
        "cartao": linha.get('Cartão') or None,
        "conta": linha.get('Conta') or None,
        "status": "Lançado",
        "origem": "migracao_sheets",
        "criadoEm": datetime.now().isoformat()
    }

def exportar_csv_para_json(caminho_csv: str, caminho_json: str):
    lancamentos = []
    with open(caminho_csv, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            item = converter_linha_sheets_para_lancamento(row)
            lancamentos.append(item)

    with open(caminho_json, mode='w', encoding='utf-8') as f:
        json.dump(lancamentos, f, indent=2, ensure_ascii=False)

    print(f"Sucesso: {len(lancamentos)} lançamentos migrados para {caminho_json}")

if __name__ == '__main__':
    print("Utilitário de Migração Pronto.")
