# api.py - API PONTE FINAL
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from datetime import datetime

# --- Configurações ---
app = Flask(__name__) 
CORS(app) 
# Dicionário para guardar o histórico: { 'ID_UNIDADE': [chamada1, chamada2, chamada3] }
historico_por_unidade = {}
MAX_HISTORICO = 3 

# --- Rota para SERVIR o Painel HTML (Recebe o ID da unidade na URL) ---
@app.route('/painel/<unidade_id>', methods=['GET'])
def exibir_painel(unidade_id):
    # O Flask procura automaticamente o arquivo em /templates/painel.html
    # O JS do painel.html se encarregará de usar o unidade_id
    # Certifique-se de que painel.html está na subpasta 'templates'
    return render_template('painel.html') 

# Rota para o Pop-up ENVIAR os novos dados da chamada (POST)
# Recebe o ID da unidade como parte da URL
@app.route('/nova-chamada/<unidade_id>', methods=['POST'])
def receber_nova_chamada(unidade_id):
    global historico_por_unidade
    dados_chamada = request.json
    
    if not dados_chamada:
        return jsonify({"status": "erro", "mensagem": "Dados inválidos."}), 400

    # 1. Cria a lista para a unidade se não existir
    if unidade_id not in historico_por_unidade:
        historico_por_unidade[unidade_id] = []
    
    # 2. Adiciona campos de hora/senha (A hora é importante para o histórico)
    dados_chamada['hora'] = datetime.now().strftime("%H:%M:%S") 
    # Assume que o popup.js ou o usuário envia a senha, senão coloca SN
    dados_chamada['senha'] = dados_chamada.get('senha', 'SN') 
    
    # 3. Adiciona a nova chamada no início da lista (mais recente)
    historico_por_unidade[unidade_id].insert(0, dados_chamada)
    
    # 4. Mantém apenas os 3 itens mais recentes
    historico_por_unidade[unidade_id] = historico_por_unidade[unidade_id][:MAX_HISTORICO] 
    
    print(f"Recebida nova chamada em UNIDADE: {unidade_id}. Histórico atual: {historico_por_unidade[unidade_id]}")
    return jsonify({"status": "sucesso", "dados": dados_chamada})

# Rota para o Painel na TV PERGUNTAR (GET)
# Retorna o histórico da unidade específica
@app.route('/historico/<unidade_id>', methods=['GET'])
def buscar_historico(unidade_id):
    # Retorna a lista de chamadas da unidade, ou uma lista vazia se não existir
    historico = historico_por_unidade.get(unidade_id, [])
    return jsonify(historico)

# Roda a aplicação (apenas para teste local)
if __name__ == '__main__':
    # Quando rodando localmente (development)
    app.run(host='0.0.0.0', port=5000, debug=True)