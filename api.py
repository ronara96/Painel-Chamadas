# No topo do api.py, atualize os imports:
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from datetime import datetime
import json
import os
import pytz  # Novo import para fusos horários

# ... (Mantenha o resto dos imports e variáveis) ...

# 🚨 FUSO HORÁRIO DE BRASÍLIA
# Define o objeto de fuso horário para São Paulo, que cobre o Horário de Brasília
BRASILIA_TZ = pytz.timezone('America/Sao_Paulo') 

# ... (Mantenha as funções get_file_path, load_historico, save_historico) ...


# Rota para o Pop-up ENVIAR os novos dados da chamada (POST)
@app.route('/nova-chamada/<unidade_id>', methods=['POST'])
def receber_nova_chamada(unidade_id):
    unidade_id = unidade_id.upper() 
    
    dados_chamada = request.json
    # ... (restante da validação) ...

    # 1. Carrega o histórico existente do arquivo
    historico = load_historico(unidade_id)
    
    # 2. Prepara os novos dados
    # 🚨 CORREÇÃO DA HORA: Agora usa o fuso horário de Brasília
    hora_brasilia = datetime.now(BRASILIA_TZ).strftime("%H:%M:%S") 
    dados_chamada['hora'] = hora_brasilia
    dados_chamada['senha'] = dados_chamada.get('senha', 'SN') 
    
    # ... (resto da lógica de salvar) ...
    
    # 3. Insere a nova chamada no topo
    historico.insert(0, dados_chamada)
    historico = historico[:MAX_HISTORICO]
    
    # 4. Salva o histórico atualizado no arquivo
    save_historico(unidade_id, historico)
    
    print(f"Recebida nova chamada em UNIDADE: {unidade_id}. Histórico atual: {historico}")
    
    return jsonify({"status": "sucesso", "mensagem": "Chamada registrada.", "historico_atual": historico}), 200

# ... (O restante das rotas permanece o mesmo) ...