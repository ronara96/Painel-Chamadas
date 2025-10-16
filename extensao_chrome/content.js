// content.js - VERSÃO 3.0 (PAINEL FLUTUANTE INJETADO)

console.log("ROBÔ EXTENSÃO VERSÃO 3.0 - Usando Painel Flutuante Injetado.");

// --- XPATHs FINAIS E UNIVERSAIS CORRIGIDOS ---
const API_URL_BASE = 'https://painel-chamadas.onrender.com'; // Sua API do Render

// 1. XPATH UNIVERSAL PARA NOME DO PACIENTE
const XPATH_TODOS_OS_NOMES = '//*[@id="root"]/div/div[3]/main/div[2]/div/div/div[2]/div/div[1]/div/div/div/div[*]/div/div[2]/div[1]/div/div[2]/div/div[2]/div[1]/span';

// 2. XPATH UNIVERSAL PARA O BOTÃO 'CHAMAR'
// Usa 'div[*]' e aponta para o 2º botão, que é o gatilho correto.
const XPATH_TODOS_OS_BOTOES_MENU = '//*[@id="root"]/div/div[3]/main/div[2]/div/div/div[2]/div/div[1]/div/div/div/div[*]/div/div[2]/div[3]/div/div/button[2]';

// 3. XPATH ESPECÍFICO PARA A UNIDADE (Correção que aponta para <p>)
const XPATH_NOME_DA_UNIDADE = '//*[@id="root"]/div/div[3]/div[1]/header/div/div/div/div[2]/div/div/div[2]/div/p'; 

let pacienteGlobal = null;
let unidadeIDGlobal = null;
let painelInjetado = null;

function getUnidadeID() {
    try {
        const result = document.evaluate(XPATH_NOME_DA_UNIDADE, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        let unidade = result.singleNodeValue ? result.singleNodeValue.textContent.trim() : 'UNIDADE_PADRAO';
        
        // Formata para ser uma ID amigável (sem espaços ou caracteres especiais)
        return unidade.toUpperCase().replace(/[^A-Z0-9]+/g, '_'); 

    } catch (e) {
        console.error('Erro ao buscar UNIDADE ID:', e);
        return 'UNIDADE_PADRAO';
    }
}

// --- FUNÇÕES DE INTERAÇÃO COM O PAINEL E API ---

async function enviarChamada(destino) {
    if (!pacienteGlobal || !unidadeIDGlobal) {
        atualizarStatus('Erro: Dados do paciente ausentes.', 'error');
        return;
    }

    const payload = {
        paciente: pacienteGlobal,
        profissional: 'Não Informado',
        guiche: destino, 
        unidade_id: unidadeIDGlobal,
        senha: 'SN' // Mantemos 'SN' (Sem Senha) conforme API
    };
    
    const url = `${API_URL_BASE}/chamar`;

    atualizarStatus(`Enviando chamado para ${destino}...`, 'loading');

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            atualizarStatus(`Chamado enviado para ${destino}!`, 'ok');
            setTimeout(esconderPainel, 2000); // Esconde após 2 segundos
        } else {
            const erro = await response.json().catch(() => ({mensagem: response.statusText}));
            atualizarStatus(`Erro do servidor (${response.status}): ${erro.mensagem || response.statusText}.`, 'error');
        }
    } catch (error) {
        atualizarStatus(`Erro de rede: ${error.message}.`, 'error');
    }
}

function atualizarStatus(mensagem, tipo) {
    if (painelInjetado) {
        const statusElement = painelInjetado.querySelector('#injetado-status-message');
        if (statusElement) {
            statusElement.textContent = mensagem;
            statusElement.className = `injetado-status-msg status-${tipo}`;
        }
    }
}

function mostrarPainel(paciente, unidadeID) {
    pacienteGlobal = paciente;
    unidadeIDGlobal = unidadeID;
    
    if (!painelInjetado) {
        criarPainel();
    }
    
    painelInjetado.querySelector('#injetado-paciente-nome').textContent = paciente;
    painelInjetado.style.display = 'block';
    painelInjetado.style.opacity = '1';
    painelInjetado.style.transform = 'translateY(0)';
    atualizarStatus('Selecione o destino para chamar.', 'default');
}

function esconderPainel() {
    if (painelInjetado) {
        painelInjetado.style.opacity = '0';
        painelInjetado.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            if (painelInjetado) painelInjetado.style.display = 'none';
        }, 300);
    }
}


// --- CRIAÇÃO E ESTILIZAÇÃO DO HTML/CSS ---

function criarPainel() {
    painelInjetado = document.createElement('div');
    painelInjetado.id = 'robô-painel-injetado';
    
    // O HTML de destino (similar ao popup.html)
    painelInjetado.innerHTML = `
        <style>
            /* Estilos CSS injetados no <head> para garantir visibilidade */
            #robô-painel-injetado {
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 99999; /* Z-Index muito alto para garantir que não será coberto */
                width: 300px;
                background-color: #ffffff;
                border-radius: 10px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                padding: 15px;
                font-family: Arial, sans-serif;
                transition: all 0.3s ease-in-out;
                display: none;
                opacity: 0;
                transform: translateY(-10px);
            }
            #injetado-fechar {
                position: absolute;
                top: 5px;
                right: 5px;
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: #ccc;
            }
            #injetado-paciente-nome { 
                font-weight: bold; 
                color: #007bff; 
                display: block;
                margin-bottom: 10px;
            }
            .injetado-row { 
                display: flex; 
                gap: 5px; 
                margin-bottom: 5px; 
                align-items: center;
            }
            .injetado-row input, .injetado-row select { 
                flex-grow: 1; 
                padding: 5px; 
                border: 1px solid #ccc; 
                border-radius: 4px;
            }
            .injetado-row button { 
                padding: 5px 10px; 
                background-color: #007bff; 
                color: white; 
                border: none; 
                border-radius: 4px; 
                cursor: pointer; 
                white-space: nowrap;
            }
            .injetado-row button:hover { background-color: #0056b3; }
            .injetado-status-msg { 
                margin-top: 10px; 
                padding: 8px; 
                text-align: center; 
                border-radius: 4px; 
                font-size: 0.9em; 
            }
            .status-ok { background-color: #d4edda; color: #155724; }
            .status-error { background-color: #f8d7da; color: #721c24; }
            .status-loading { background-color: #fff3cd; color: #856404; }
            .status-default { background-color: #e2e3e5; color: #383d41; }
        </style>
        
        <button id="injetado-fechar">X</button>
        <div style="font-size: 0.9em; color: #555;">Chamada para:</div>
        <div id="injetado-paciente-nome"></div>
        
        <div style="font-weight: bold; margin-top: 10px;">Consultório</div>
        <div class="injetado-row">
            <input type="text" id="injetado-input-consultorio" placeholder="Ex: 1, 2, 3">
            <button id="injetado-btn-chamar-consultorio">Chamar</button>
        </div>

        <div style="font-weight: bold; margin-top: 10px;">Serviço</div>
        <div class="injetado-row">
            <select id="injetado-select-servico">
                <option value="">-- Selecione o Serviço --</option>
                <option value="ODONTOLOGIA">ODONTOLOGIA</option>
                <option value="FARMÁCIA">FARMÁCIA</option>
                <option value="VACINA">VACINA</option>
                <option value="ENFERMAGEM">ENFERMAGEM</option>
                <option value="TRIAGEM">TRIAGEM</option>
                <option value="CURATIVOS">CURATIVOS</option>
                <option value="EXAMES">EXAMES</option>
                <option value="CONSULTA">CONSULTA</option>
            </select>
            <button id="injetado-btn-chamar-servico">Chamar</button>
        </div>
        
        <div id="injetado-status-message" class="injetado-status-msg status-default">Aguardando clique no botão...</div>
    `;
    
    document.body.appendChild(painelInjetado);
    
    // Adiciona Listeners para o painel injetado
    painelInjetado.querySelector('#injetado-fechar').addEventListener('click', esconderPainel);

    painelInjetado.querySelector('#injetado-btn-chamar-consultorio').addEventListener('click', () => {
        const input = painelInjetado.querySelector('#injetado-input-consultorio').value.trim();
        if (input) {
            enviarChamada(`CONSULTÓRIO ${input}`);
        } else {
            atualizarStatus("Digite um número de consultório.", 'error');
        }
    });

    painelInjetado.querySelector('#injetado-btn-chamar-servico').addEventListener('click', () => {
        const select = painelInjetado.querySelector('#injetado-select-servico').value;
        if (select) {
            enviarChamada(select);
        } else {
            atualizarStatus("Selecione um serviço na lista.", 'error');
        }
    });
}

// --- LÓGICA DO ROBÔ DE MONITORAMENTO ---
function monitorarBotoes() {
    const unidadeID = getUnidadeID();
    
    // 1. Coleta todos os nomes
    const nomeNodes = document.evaluate(XPATH_TODOS_OS_NOMES, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    const arrayDeNomes = [];
    for (let i = 0; i < nomeNodes.snapshotLength; i++) {
        arrayDeNomes.push(nomeNodes.snapshotItem(i));
    }
    
    // 2. Coleta todos os botões de ação (botão "Chamar")
    const botaoNodes = document.evaluate(XPATH_TODOS_OS_BOTOES_MENU, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    const arrayDeBotoes = [];
    for (let i = 0; i < botaoNodes.snapshotLength; i++) {
        arrayDeBotoes.push(botaoNodes.snapshotItem(i));
    }
    
    // 3. Adiciona o listener de clique para cada botão
    arrayDeBotoes.forEach((botao, index) => {
        // Verifica se o listener já foi adicionado
        if (!botao.__listenerAdded) {
            botao.__listenerAdded = true;
            
            botao.addEventListener('click', (event) => {
                // Previne a ação padrão do botão, se houver
                // event.preventDefault(); 
                
                try {
                    const nomeElement = arrayDeNomes[index];
                    
                    if (nomeElement) {
                        const paciente = nomeElement.textContent.trim();
                        
                        // MOSTRA O PAINEL FLUTUANTE EM VEZ DE TENTAR ABRIR O POPUP
                        mostrarPainel(paciente, unidadeID); 
                        console.log(`Painel Injetado Ativado: Unidade: ${unidadeID} | Paciente: ${paciente}`);
                    } else {
                        console.error(`Erro: Botão na posição ${index} clicado, mas nenhum nome correspondente foi encontrado.`);
                    }

                } catch (e) {
                    console.error('Erro ao processar clique:', e);
                }
            });
        }
    });
}

// Inicialização e Observador (garante que a função rode quando a lista muda)
const observer = new MutationObserver(monitorarBotoes);
observer.observe(document.body, { childList: true, subtree: true });

// Executa a função uma vez quando a página carrega
monitorarBotoes();