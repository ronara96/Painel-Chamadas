# api.py - API AGORA PERSISTE DADOS EM ARQUIVOS JSON (CORREÇÃO DE MEMÓRIA DO RENDER)
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from datetime import datetime
import json
import os

# --- Configurações --
app = Flask(__name__) 
CORS(app) 

# Diretório onde os arquivos de histórico serão salvos
DATA_DIR = 'data'
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

MAX_HISTORICO = 3 

# Função para obter o caminho do arquivo de histórico de uma unidade
def get_file_path(unidade_id):
    return os.path.join(DATA_DIR, f'{unidade_id}.json')

# Função para carregar o histórico de uma unidade do arquivo
def load_historico(unidade_id):
    filepath = get_file_path(unidade_id)
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            # Se o arquivo estiver corrompido ou vazio, retorna lista vazia
            return []
    return []

# Função para salvar o histórico de uma unidade no arquivo
def save_historico(unidade_id, historico):
    filepath = get_file_path(unidade_id)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(historico, f, ensure_ascii=False, indent=4)

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
    
    # 4. Salva o histórico atualizado no arquivo
    save_historico(unidade_id, historico)
    
    print(f"Recebida nova chamada em UNIDADE: {unidade_id}. Histórico atual: {historico}")
    
    return jsonify({"status": "sucesso", "mensagem": "Chamada registrada.", "historico_atual": historico}), 200

# Rota para o Painel RECEBER o histórico (GET)
@app.route('/historico/<unidade_id>', methods=['GET'])
def get_historico(unidade_id):
    # Simplesmente carrega e retorna o histórico do arquivo
    historico = load_historico(unidade_id)
    
    # Se o histórico estiver vazio, a API retornará {"historico": []}, o que é esperado
    return jsonify({"historico": historico}), 200

if __name__ == '__main__':
    app.run(debug=True)
