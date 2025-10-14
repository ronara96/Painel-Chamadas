// popup.js

// 🚨 IMPORTANTE: ATUALIZE COM SUA URL PÚBLICA DO RAILWAY
const API_URL_BASE = 'https://SUA_URL_PUBLICA_RAILWAY';

let dadosChamada = null;
const statusMessage = document.getElementById('status-message');
const pacienteNomeElement = document.getElementById('paciente-nome');

// Solicita os dados armazenados ao Service Worker
chrome.runtime.sendMessage({ action: "obterDadosChamada" }, (response) => {
    if (response && response.dados) {
        dadosChamada = response.dados;
        pacienteNomeElement.textContent = dadosChamada.paciente;
    } else {
        pacienteNomeElement.textContent = "Erro: Sem dados da chamada. Feche e tente novamente.";
    }
});

// Função para enviar os dados para a API Pública
async function enviarChamada(destino) {
    if (!dadosChamada) {
        statusMessage.textContent = "Erro: Dados ausentes.";
        statusMessage.className = 'status-msg status-error';
        return;
    }

    const { paciente, unidade_id, profissional } = dadosChamada;
    
    // Payload final que será enviado
    const payload = {
        paciente: paciente,
        profissional: profissional || 'Não Informado',
        guiche: destino, // Novo campo
        senha: 'SN' // Mantido como padrão. Você pode implementar um contador se quiser.
    };
    
    // A rota é /nova-chamada/ID_DA_UNIDADE
    const url = `${API_URL_BASE}/nova-chamada/${unidade_id}`;

    statusMessage.textContent = `Enviando chamado para ${destino}...`;
    statusMessage.className = 'status-msg';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            statusMessage.textContent = `Chamado enviado com sucesso!`;
            statusMessage.className = 'status-msg status-ok';
            
            // Fecha o pop-up automaticamente após 1.5 segundos
            setTimeout(() => {
                window.close();
            }, 1500); 

        } else {
            const erro = await response.json().catch(() => ({mensagem: response.statusText}));
            statusMessage.textContent = `Erro do servidor: ${erro.mensagem || response.statusText}`;
            statusMessage.className = 'status-msg status-error';
        }
    } catch (error) {
        statusMessage.textContent = `Erro de rede: Verifique a URL: ${error.message}`;
        statusMessage.className = 'status-msg status-error';
    }
}

// Adiciona listeners aos botões
document.querySelectorAll('.guiche-grid button').forEach(button => {
    button.addEventListener('click', () => {
        const destino = button.getAttribute('data-destino');
        enviarChamada(destino);
    });
});