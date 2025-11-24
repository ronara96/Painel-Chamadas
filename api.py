import os
import json
from datetime import datetime
import pytz
from flask import Flask, jsonify, request, send_file, render_template
from gtts import gTTS 
from flask_cors import CORS 
import io # Para trabalhar com MP3 na memória

# --- CONFIGURAÇÕES INICIAIS ---
app = Flask(__name__)
CORS(app) 
MAX_HISTORICO = 5 
DATA_DIR = os.path.join(os.getcwd(), 'dados_chamadas')

# Cria o diretório de dados 
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR, exist_ok=True) 

# Define o fuso horário para Brasília
BRASILIA_TZ = pytz.timezone('America/Sao_Paulo') 


# --- Funções de Persistência em Disco (JSON) ---

def get_file_path(unidade_id):
    return os.path.join(DATA_DIR, f'{unidade_id.upper()}.json')

def load_historico(unidade_id):
    filepath = get_file_path(unidade_id)
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                return json.loads(content) if content else []
        except json.JSONDecodeError as e:
            print(f"ERRO ao decodificar JSON em {filepath}: {e}")
            return []
    return []

def save_historico(unidade_id, historico):
    filepath = get_file_path(unidade_id)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(historico, f, ensure_ascii=False, indent=4)


# --- Rotas da Aplicação ---

# Rota para renderizar a página do painel (GET) - CORRIGIDA!
@app.route('/painel/<unidade_id>', methods=['GET'])
def painel(unidade_id):
    # O Flask procura templates/painel.html
    return render_template('painel.html', unidade_id=unidade_id.upper())

# Rota para a Extensão ENVIAR uma nova chamada (POST)
@app.route('/chamar', methods=['POST'])
def receber_nova_chamada():
    dados_chamada = request.json
    
    if not dados_chamada or 'paciente' not in dados_chamada or 'unidade_id' not in dados_chamada:
        return jsonify({"status": "erro", "mensagem": "Dados de paciente ou unidade ausentes."}), 400
        
    unidade_id = dados_chamada['unidade_id'].upper()
    historico = load_historico(unidade_id)
    
    # 1. Gera a hora correta de Brasília
    hora_brasilia = datetime.now(BRASILIA_TZ).strftime("%H:%M:%S") 
    dados_chamada['hora'] = hora_brasilia
    
    # 2. GERA A FRASE COMPLETA E SALVA NO HISTÓRICO
    destino = dados_chamada.get('guiche') or dados_chamada.get('servico')
    
    texto_local = destino.replace('CONSULTÓRIO ', 'Consultório ')
    texto_local = texto_local.replace('SERVIÇO ', 'Serviço ')
    frase_completa = f"Chamando {dados_chamada['paciente']}. Por favor, dirija-se a {texto_local}."
    dados_chamada['frase_audio'] = frase_completa 
    
    # 3. Atualiza e salva o histórico
    historico.insert(0, dados_chamada)
    historico = historico[:MAX_HISTORICO]
    
    save_historico(unidade_id, historico)
    
    return jsonify({"status": "sucesso", "mensagem": "Chamada registrada.", "frase_audio": frase_completa}), 200

# ----------------------------------------------------
# NOVA ROTA: Geração de Áudio em Memória (GET)
# ----------------------------------------------------
@app.route('/gerar_audio', methods=['GET'])
def gerar_audio_em_memoria():
    """Recebe o texto via query string, gera o MP3 na memória e o retorna."""
    texto = request.args.get('texto')
    if not texto:
        # Se o texto estiver vazio, retorna um MP3 mudo (usado no loop de desbloqueio)
        texto = '...' 

    try:
        # Gera o MP3 na memória
        tts = gTTS(text=texto, lang='pt', slow=False)
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0) # Volta ao início do arquivo
        
        # Retorna o arquivo de áudio diretamente da memória
        return send_file(
            mp3_fp, 
            mimetype='audio/mp3', 
            as_attachment=False, 
            download_name='chamada.mp3'
        )

    except Exception as e:
        print(f"ERRO Crítico na geração de áudio: {e}")
        return jsonify({"erro": "Falha ao gerar o áudio no servidor."}), 500


# Rota para o Painel RECEBER o histórico (GET)
@app.route('/historico/<unidade_id>', methods=['GET'])
def get_historico(unidade_id):
    unidade_id = unidade_id.upper() 
    historico = load_historico(unidade_id) 
    
    return jsonify({
        "status": "sucesso", 
        "unidade_id": unidade_id,
        "historico": historico
    }), 200

# Necessário para Gunicorn (Render)
if __name__ == "__main__":
    app.run(debug=True)
