import os
import json
from datetime import datetime
import pytz
from flask import Flask, jsonify, request, send_from_directory, render_template
from gtts import gTTS # <<< NOVA IMPORTAÇÃO
import hashlib # Para criar nomes de arquivo únicos

# --- CONFIGURAÇÕES INICIAIS (Ajuste conforme necessário) ---
app = Flask(__name__)
MAX_HISTORICO = 5 # Manter os 5 últimos chamados
DATA_DIR = os.path.join(os.getcwd(), 'dados_chamadas')

# Cria o diretório de dados e o diretório de áudio
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR, exist_ok=True) 

AUDIO_DIR = os.path.join(os.getcwd(), 'audio_cache') # <<< NOVO DIRETÓRIO
if not os.path.exists(AUDIO_DIR):
    os.makedirs(AUDIO_DIR, exist_ok=True)

# Define o fuso horário para Brasília
BRASILIA_TZ = pytz.timezone('America/Sao_Paulo') 


# --- 2. Funções de Persistência em Disco (JSON) ---

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


# ----------------------------------------------------
# FUNÇÃO: Geração de Áudio (TTS)
# ----------------------------------------------------
def gerar_audio_chamada(paciente, destino, unidade_id):
    """Gera o arquivo MP3 da chamada usando gTTS (voz padrão Google)."""
    
    # 1. Monta a frase de chamada
    # Ajustes na pronúncia para leitura (ex: Consultório 1 -> Consultório um)
    texto_local = destino.replace('CONSULTÓRIO ', 'Consultório ')
    texto_local = texto_local.replace('SERVIÇO ', 'Serviço ')
    
    frase_chamada = f"Chamando {paciente}. Por favor, dirija-se a {texto_local}."
    
    # 2. Cria um hash único para o nome do arquivo (para cache)
    file_hash = hashlib.sha1(frase_chamada.encode('utf-8')).hexdigest()
    filename = f'{unidade_id}_{file_hash}.mp3'
    filepath = os.path.join(AUDIO_DIR, filename)
    
    # 3. Tenta carregar se o arquivo já existir
    if os.path.exists(filepath):
        print(f"DEBUG: Áudio encontrado em cache: {filename}")
        return filename
    
    # 4. Gera e salva o MP3
    try:
        # Nota: gTTS usa a voz padrão do Google, que é feminina, mas de alta qualidade.
        # Ela resolve o problema de soletração e é consistente em qualquer dispositivo.
        tts = gTTS(text=frase_chamada, lang='pt', slow=False) 
        tts.save(filepath)
        print(f"DEBUG: Novo áudio gerado e salvo: {filename}")
        return filename
    except Exception as e:
        print(f"ERRO ao gerar áudio com gTTS: {e}")
        return None


# --- 3. Rotas da Aplicação ---

# Rota para renderizar a página do painel (GET)
@app.route('/painel/<unidade_id>', methods=['GET'])
def painel(unidade_id):
    # Assume que o painel HTML está em 'templates/painel.html'
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
    
    # 2. GERA O ÁUDIO e salva o nome do arquivo
    destino = dados_chamada.get('guiche') or dados_chamada.get('servico')
    audio_file = gerar_audio_chamada(dados_chamada['paciente'], destino, unidade_id)
    
    # Salva o nome do arquivo de áudio no histórico
    dados_chamada['audio_file'] = audio_file 
    
    # 3. Atualiza e salva o histórico
    historico.insert(0, dados_chamada)
    historico = historico[:MAX_HISTORICO]
    
    save_historico(unidade_id, historico)
    
    print(f"Recebida nova chamada em UNIDADE: {unidade_id}. Áudio: {audio_file}")
    
    return jsonify({"status": "sucesso", "mensagem": "Chamada registrada.", "audio_file": audio_file}), 200


# ----------------------------------------------------
# ROTA DE SERVIÇO DE ÁUDIO
# ----------------------------------------------------
@app.route('/audio/<filename>', methods=['GET'])
def servir_audio(filename):
    """Permite que o frontend acesse os arquivos MP3 gerados."""
    try:
        # Retorna o arquivo MP3 do diretório de cache
        return send_from_directory(AUDIO_DIR, filename, as_attachment=False)
    except FileNotFoundError:
        return jsonify({"status": "erro", "mensagem": "Arquivo de áudio não encontrado."}), 404

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
