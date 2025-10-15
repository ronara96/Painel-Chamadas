# api.py - VERSÃO FINAL COM PERSISTÊNCIA JSON E TRATAMENTO DE ERROS

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from datetime import datetime
import json
import os

# --- Configurações ---
app = Flask(__name__) 
CORS(app) 

# Usa o caminho absoluto para o diretório de dados (mais seguro no Render)
DATA_DIR = os.path.join(os.getcwd(), 'data')
MAX_HISTORICO = 3 

# Função para obter o caminho do arquivo de histórico de uma unidade
def get_file_path(unidade_id):
    return os.path.join(DATA_DIR, f'{unidade_id}.json')

# Função para carregar o histórico de uma unidade do arquivo
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

# Função para salvar o histórico de uma unidade no arquivo
def save_historico(unidade_id, historico):
    filepath = get_file_path(unidade_id)
    try:
        # Tenta salvar o arquivo
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(historico, f, ensure_ascii=False, indent=4)
        print(f"DEBUG: Histórico de {unidade_id} SALVO com sucesso em {filepath}")
    except Exception as e:
        # 🚨 ESTA MENSAGEM IRÁ CONFIRMAR O ERRO DE PERMISSÃO NO RENDER
        print(f"ERRO CRÍTICO: Falha ao SALVAR o histórico da unidade {unidade_id} no disco. O Render pode estar bloqueando a escrita. Erro: {e}")
        # A API continuará rodando, mas o dado não será persistido.

# --- ROTAS DA API ---

# Rota de Diagnóstico
@app.route('/', methods=['GET'])
def home():
    return "API do Painel de Chamadas Rodando. A persistência de dados em arquivo está ativa.", 200

# Rota para SERVIR o Painel HTML
@app.route('/painel/<unidade_id>', methods=['GET'])
def exibir_painel(unidade_id):
    return render_template('painel.html') 

# Rota para o Pop-up ENVIAR os novos dados da chamada (POST)
@app.route('/nova-chamada/<unidade_id>', methods=['POST'])
def receber_nova_chamada(unidade_id):
    dados_chamada = request.json
    
    if not dados_chamada or ('paciente' not in dados_chamada and 'senha' not in dados_chamada):
        return jsonify({"status": "erro", "mensagem": "Dados de paciente/senha ausentes."}), 400

    # 1. Carrega o histórico existente do arquivo
    historico = load_historico(unidade_id)
    
    # 2. Prepara os novos dados
    dados_chamada['hora'] = datetime.now().strftime("%H:%M:%S") 
    dados_chamada['senha'] = dados_chamada.get('senha', 'SN') 
    
    # 3. Insere a nova chamada no topo
    historico.insert(0, dados_chamada)
    historico = historico[:MAX_HISTORICO] # Limita o histórico
    
    # 4. Salva o histórico atualizado no arquivo (Onde o erro de permissão pode ocorrer)
    save_historico(unidade_id, historico)
    
    print(f"Recebida nova chamada em UNIDADE: {unidade_id}. Histórico atual: {historico}")
    
    return jsonify({"status": "sucesso", "mensagem": "Chamada registrada.", "historico_atual": historico}), 200

# Rota para o Painel RECEBER o histórico (GET)
@app.route('/historico/<unidade_id>', methods=['GET'])
def get_historico(unidade_id):
    # Simplesmente carrega e retorna o histórico do arquivo
    historico = load_historico(unidade_id)
    
    return jsonify({"historico": historico}), 200

if __name__ == '__main__':
    # Garante que o diretório exista antes de iniciar a aplicação localmente
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        print(f"Diretório de dados criado em: {DATA_DIR}")
        
    app.run(debug=True)