# api.py - API PONTE FINAL E ESTÁVEL
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from datetime import datetime
import os # ESSENCIAL: Permite pegar a porta do Railway

# --- Configurações ---
app = Flask(__name__) 
CORS(app) 

# Dicionário para guardar o histórico: { 'ID_UNIDADE': [chamada1, chamada2, chamada3] }
historico_por_unidade = {}
MAX_HISTORICO = 3 

# --- ROTA DE DIAGNÓSTICO ---
# Se o servidor subir, esta rota deve responder.
@app.route('/', methods=['GET'])
def home():
    # Se você vir esta mensagem no navegador, o servidor Flask está online.
    return "API do Painel de Chamadas Rodando. Por favor, acesse /painel/<unidade_id>.", 200

# --- Rota para SERVIR o Painel HTML (Recebe o ID da unidade na URL) ---
@app.route('/painel/<unidade_id>', methods=['GET'])
def exibir_painel(unidade_id):
    # O Flask procura automaticamente o arquivo em /templates/painel.html
    return render_template('painel.html') 

# Rota para o Pop-up ENVIAR os novos dados da chamada (POST)
@app.route('/nova-chamada/<unidade_id>', methods=['POST'])
def receber_nova_chamada(unidade_id):
    global historico_por_unidade
    dados_chamada = request.json
    
    if not dados_chamada or 'paciente' not in dados_chamada or 'guiche' not in dados_chamada:
        return jsonify({"status": "erro", "mensagem": "Dados inválidos."}), 400

    if unidade_id not in historico_por_unidade:
        historico_por_unidade[unidade_id] = []
    
    dados_chamada['hora'] = datetime.now().strftime("%H:%M:%S") 
    dados_chamada['senha'] = dados_chamada.get('senha', 'SN') 
    
    historico_por_unidade[unidade_id].insert(0, dados_chamada)
    historico_por_unidade[unidade_id] = historico_por_unidade[unidade_id][:MAX_HISTORICO] 
    
    print(f"Recebida nova chamada em UNIDADE: {unidade_id}. Histórico atual: {historico_por_unidade[unidade_id]}")
    return jsonify({"status": "sucesso", "dados": dados_chamada})

# Rota para o Painel na TV PERGUNTAR (GET)
@app.route('/historico/<unidade_id>', methods=['GET'])
def retornar_historico(unidade_id):
    historico = historico_por_unidade.get(unidade_id, [])
    return jsonify({"historico": historico})

# --- Bloco de Inicialização (Garantia de Porta) ---
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000)) 
    app.run(host='0.0.0.0', port=port, debug=False)