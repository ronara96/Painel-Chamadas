# api.py - VERSÃO FINAL (PERSISTÊNCIA, FUSO HORÁRIO DE BRASÍLIA E REMOÇÃO DA SENHA)

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
MAX_HISTORICO = 3 

# Define o fuso horário para Brasília
BRASILIA_TZ = pytz.timezone('America/Sao_Paulo') 


# --- 2. Funções de Persistência em Disco (JSON) ---

def get_file_path(unidade_id):
    # Garante que o ID usado no nome do arquivo está padronizado (maiúsculas)
    return os.path.join(DATA_DIR, f'{unidade_id}.json')

def load_historico(unidade_id):
    filepath = get_file_path(unidade_id)
    print(f"DEBUG: Tentando carregar o arquivo: {filepath}") 
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                if content:
                    return json.loads(content)
                return []
        except Exception as e:
            print(f"ERRO ao ler JSON de {filepath}: {e}")
            return []
    return []

def save_historico(unidade_id, historico):
    filepath = get_file_path(unidade_id)
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(historico, f, ensure_ascii=False, indent=4)
        print(f"DEBUG: Histórico de {unidade_id} SALVO com sucesso em {filepath}")
    except Exception as e:
        print(f"ERRO CRÍTICO: Falha ao SALVAR o histórico da unidade {unidade_id} no disco. Erro: {e}") 


# --- 3. ROTAS DA API ---

# Rota de Diagnóstico
@app.route('/', methods=['GET'])
def home():
    return "API do Painel de Chamadas Rodando. Persistência e Hora de Brasília ativas.", 200

# Rota para SERVIR o Painel HTML
@app.route('/painel/<unidade_id>', methods=['GET'])
def exibir_painel(unidade_id):
    return render_template('painel.html') 

# Rota para o Pop-up ENVIAR os novos dados da chamada (POST)
@app.route('/nova-chamada/<unidade_id>', methods=['POST'])
def receber_nova_chamada(unidade_id):
    # Garante a padronização do ID da unidade
    unidade_id = unidade_id.upper() 
    
    dados_chamada = request.json
    
    # Valida apenas a existência do paciente
    if not dados_chamada or 'paciente' not in dados_chamada:
        return jsonify({"status": "erro", "mensagem": "Dados de paciente ausentes."}), 400

    historico = load_historico(unidade_id)
    
    # Gera a hora correta de Brasília
    hora_brasilia = datetime.now(BRASILIA_TZ).strftime("%H:%M:%S") 
    dados_chamada['hora'] = hora_brasilia
    # O campo 'senha' foi removido
    
    historico.insert(0, dados_chamada)
    historico = historico[:MAX_HISTORICO]
    
    save_historico(unidade_id, historico)
    
    print(f"Recebida nova chamada em UNIDADE: {unidade_id}. Histórico atual: {historico}")
    
    return jsonify({"status": "sucesso", "mensagem": "Chamada registrada.", "historico_atual": historico}), 200

# Rota para o Painel RECEBER o histórico (GET)
@app.route('/historico/<unidade_id>', methods=['GET'])
def get_historico(unidade_id):
    # Garante a padronização do ID da unidade para leitura do arquivo
    unidade_id = unidade_id.upper() 

    historico = load_historico(unidade_id)
    
    return jsonify({"historico": historico}), 200

if __name__ == '__main__':
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        print(f"Diretório de dados criado em: {DATA_DIR}")
        
    app.run(debug=True)