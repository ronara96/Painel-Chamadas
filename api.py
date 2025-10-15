# api.py - CORREÇÃO DE CASE SENSITIVITY (MAIÚSCULAS/MINÚSCULAS)

# ... (Mantenha o resto dos imports e configurações) ...

# Rota para o Pop-up ENVIAR os novos dados da chamada (POST)
@app.route('/nova-chamada/<unidade_id>', methods=['POST'])
def receber_nova_chamada(unidade_id):
    # 🚨 CORREÇÃO ESSENCIAL: Padroniza o ID para o arquivo antes de qualquer operação
    unidade_id = unidade_id.upper() 
    
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
    # 🚨 CORREÇÃO ESSENCIAL: Padroniza o ID para o arquivo antes de qualquer operação
    unidade_id = unidade_id.upper() 

    # Simplesmente carrega e retorna o histórico do arquivo
    historico = load_historico(unidade_id)
    
    return jsonify({"historico": historico}), 200

# ... (Mantenha o restante das rotas e do código) ...