// painel_tab.js - LÓGICA DA NOVA ABA
const API_URL_BASE = 'https://painel-chamadas.onrender.com'; 

let dadosChamada = null;
const statusMessage = document.getElementById('status-message');
const pacienteNomeElement = document.getElementById('paciente-nome');

// Solicita os dados armazenados ao Service Worker (background.js)
chrome.runtime.sendMessage({ action: "obterDadosChamada" }, (response) => {
    if (response && response.dados && response.dados.paciente) {
        dadosChamada = response.dados;
        pacienteNomeElement.textContent = dadosChamada.paciente;
        statusMessage.textContent = "Selecione o destino acima para chamar.";
        statusMessage.className = 'status-msg';
        
        // Opcional: Fecha a aba após 10 minutos se o usuário não fizer nada
        // setTimeout(() => { window.close(); }, 600000); 
    } else {
        pacienteNomeElement.textContent = "Erro: Sem dados da chamada.";
        statusMessage.textContent = "Por favor, clique no botão 'Chamar' na lista novamente (Erro de comunicação com o background).";
        statusMessage.className = 'status-msg status-error';
    }
});

// Função principal para enviar os dados para a API Pública
async function enviarChamada(destino) {
    if (!dadosChamada) {
        statusMessage.textContent = "Erro: Dados ausentes.";
        statusMessage.className = 'status-msg status-error';
        return;
    }

    const { paciente, unidade_id, profissional } = dadosChamada;
    
    // PAYLOAD FINAL ENVIADO AO SERVIDOR (FORMATO JSON)
    const payload = {
        paciente: paciente,
        profissional: profissional, // 'Não Informado'
        guiche: destino,
        unidade_id: unidade_id, // Ex: UBS_RETIRO
        senha: 'SN'
    };

    const url = `${API_URL_BASE}/chamar/${unidade_id}`; 
    statusMessage.textContent = `Enviando chamado para ${destino}...`;
    statusMessage.className = 'status-msg';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            statusMessage.textContent = `Chamado enviado para ${destino}! Esta aba será fechada em 3 segundos.`;
            statusMessage.className = 'status-msg status-ok';
            // Fecha a aba após o envio bem-sucedido
            setTimeout(() => { window.close(); }, 3000); 
        } else {
            const erro = await response.json().catch(() => ({mensagem: response.statusText}));
            statusMessage.textContent = `Erro do servidor (${response.status}): ${erro.mensagem || response.statusText}.`;
            statusMessage.className = 'status-msg status-error';
        }
    } catch (error) {
        statusMessage.textContent = `Erro de rede: ${error.message}. Verifique sua conexão ou se o Render está online.`;
        statusMessage.className = 'status-msg status-error';
    }
}

// --- LISTENERS DE AÇÃO ---

// 1. Botão Chamar Consultório
document.getElementById('btn-chamar-consultorio').addEventListener('click', () => {
    const inputConsultorio = document.getElementById('input-consultorio').value.trim();
    
    if (!inputConsultorio || isNaN(parseInt(inputConsultorio))) {
        statusMessage.textContent = "Por favor, digite um NÚMERO válido para o Consultório.";
        statusMessage.className = 'status-msg status-error';
        return;
    }
    
    const destinoFinal = `CONSULTÓRIO ${inputConsultorio}`;
    enviarChamada(destinoFinal);
});

// 2. Botão Chamar Serviço
document.getElementById('btn-chamar-servico').addEventListener('click', () => {
    const selectServico = document.getElementById('select-servico');
    const servicoSelecionado = selectServico.value;
    
    if (!servicoSelecionado) {
        statusMessage.textContent = "Por favor, selecione um Serviço na lista.";
        statusMessage.className = 'status-msg status-error';
        return;
    }
    
    enviarChamada(servicoSelecionado);
});