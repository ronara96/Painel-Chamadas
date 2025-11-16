# api.py - VERSÃO 5.0 (Histórico expandido e envio de lista completa)

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from datetime import datetime
import json
import os
import pytz # Import para fuso horário

# --- 1. Inicialização do Flask e Configurações de Fuso Horário ---
app = Flask(__name__) 
CORS(app) 

# Variáveis de controle
DATA_DIR = os.path.join(os.getcwd(), 'data')
# CORREÇÃO 1: Aumenta o histórico para 5 (1 atual + 4 no histórico)
MAX_HISTORICO = 5 

# CORREÇÃO CRÍTICA PARA O RENDER: Garante que a pasta 'data' existe na inicialização
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR, exist_ok=True) 

# Define o fuso horário para Brasília
BRASILIA_TZ = pytz.timezone('America/Sao_Paulo') 


# --- 2. Funções de Persistência em Disco (JSON) ---

def get_file_path(unidade_id):
    # Garante que o ID usado no nome do arquivo está padronizado (maiúsculas)
    return os.path.join(DATA_DIR, f'{unidade_id.upper()}.json')

def load_historico(unidade_id):
    filepath = get_file_path(unidade_id)
    print(f"DEBUG: Tentando carregar o arquivo: {filepath}") 
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                if content:
                    return json.loads(content)
                else:
                    return []
        except json.JSONDecodeError as e:
            print(f"ERRO ao decodificar JSON em {filepath}: {e}")
            return []
    return []

def save_historico(unidade_id, historico):
    filepath = get_file_path(unidade_id)
    print(f"DEBUG: Salvando histórico em: {filepath}")
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(historico, f, ensure_ascii=False, indent=4)


# --- 3. Rotas da Aplicação ---

# Rota para renderizar a página do painel (GET)
@app.route('/painel/<unidade_id>', methods=['GET'])
def painel(unidade_id):
    # Passa o ID da unidade para o template HTML, que o usará no JavaScript
    return render_template('painel.html', unidade_id=unidade_id.upper())

# Rota para a Extensão ENVIAR uma nova chamada (POST)
@app.route('/chamar', methods=['POST'])
def receber_nova_chamada():
    # O payload deve incluir 'unidade_id'
    dados_chamada = request.json
    
    # 1. Validação inicial e ID da unidade
    if not dados_chamada or 'paciente' not in dados_chamada or 'unidade_id' not in dados_chamada:
        return jsonify({"status": "erro", "mensagem": "Dados de paciente ou unidade ausentes."}), 400
        
    unidade_id = dados_chamada['unidade_id'].upper()
    
    historico = load_historico(unidade_id)
    
    # 2. Gera a hora correta de Brasília
    hora_brasilia = datetime.now(BRASILIA_TZ).strftime("%H:%M:%S") 
    dados_chamada['hora'] = hora_brasilia
    
    # 3. Atualiza e salva o histórico
    historico.insert(0, dados_chamada)
    historico = historico[:MAX_HISTORICO] # Agora salva os 5 últimos
    
    save_historico(unidade_id, historico)
    
    print(f"Recebida nova chamada em UNIDADE: {unidade_id}. Histórico atual: {historico}")
    
    return jsonify({"status": "sucesso", "mensagem": "Chamada registrada.", "historico_atual": historico}), 200

# Rota para o Painel RECEBER o histórico (GET)
@app.route('/historico/<unidade_id>', methods=['GET'])
def get_historico(unidade_id):
    # Garante a padronização do ID da unidade
    unidade_id = unidade_id.upper() 
    
    historico = load_historico(unidade_id) # Carrega a lista completa (ex: 5 itens)
    
    # CORREÇÃO 2: Envia a lista INTEIRA para o painel.
    # O painel (JavaScript) será responsável por dividir o que é "atual" e "histórico".
    return jsonify({
        "status": "sucesso", 
        "unidade_id": unidade_id,
        "historico": historico # Envia a lista completa
    }), 200

# Necessário para Gunicorn (Render)
if __name__ == "__main__":
    app.run(debug=True)
