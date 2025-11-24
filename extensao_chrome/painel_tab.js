// painel_tab.js - LÓGICA DA NOVA ABA (VERSÃO 5.0: Com Histórico + Sem Fechamento)

const API_URL_BASE = 'https://painel-chamadas.onrender.com'; 

let dadosChamada = null; // Armazenará apenas o paciente ATUAL
const statusMessage = document.getElementById('status-message');
const pacienteNomeElement = document.getElementById('paciente-nome');
const historicoListaElement = document.getElementById('historico-lista');

// Elementos dos botões (para desativar)
const btnConsultorio = document.getElementById('btn-chamar-consultorio');
const btnServico = document.getElementById('btn-chamar-servico');

// --- 1. FUNÇÕES DE AJUDA ---

function setStatus(tipo, mensagem) {
    statusMessage.textContent = mensagem;
    statusMessage.className = `status-msg ${tipo}`; // ex: status-ok, status-error, status-loading
}

function desativarBotoes(desativar) {
    btnConsultorio.disabled = desativar;
    btnServico.disabled = desativar;
}

// --- 2. SOLICITAÇÃO DE DADOS ---
// Pede o objeto 'dadosChamadaGlobal' (que contém 'atual' e 'historico')
chrome.runtime.sendMessage({ action: "obterDadosChamada" }, (response) => {
    if (response && response.dados) {
        
        // A. Preenche o Paciente ATUAL
        if (response.dados.atual && response.dados.atual.paciente) {
            dadosChamada = response.dados.atual; // Salva globalmente o paciente atual
            pacienteNomeElement.textContent = dadosChamada.paciente;
            setStatus("", "Selecione o destino acima para chamar.");
        } else {
            pacienteNomeElement.textContent = "Erro: Sem dados da chamada.";
            setStatus("status-error", "Por favor, clique no botão 'Chamar' na lista novamente (Erro de comunicação com o background).");
        }
        
        // B. Preenche o HISTÓRICO
        historicoListaElement.innerHTML = ''; // Limpa a lista
        if (response.dados.historico && response.dados.historico.length > 0) {
            response.dados.historico.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${item.paciente}</strong> (Prof: ${item.profissional})`;
                historicoListaElement.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = "Nenhum paciente chamado anteriormente nesta sessão.";
            historicoListaElement.appendChild(li);
        }
        
    } else {
         setStatus("status-error", "Falha crítica ao obter dados do background.");
    }
});

// --- 3. FUNÇÃO DE ENVIO PARA API ---
async function enviarChamada(destino) {
    if (!dadosChamada) {
        setStatus("status-error", "Erro: Dados ausentes. Tente chamar na lista e-SUS novamente.");
        return;
    }

    desativarBotoes(true);
    setStatus("status-loading", `Conectando ao servidor... (Pode levar 20s no 1º chamado)`);

    const { paciente, unidade_id, profissional } = dadosChamada;
    
    const payload = {
        paciente: paciente,
        profissional: profissional,
        guiche: destino,
        unidade_id: unidade_id,
        senha: 'SN'
    };

    const url = `${API_URL_BASE}/chamar`; 

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            setStatus("status-ok", `Chamado enviado para ${destino}! Esta aba permanecerá aberta.`);
            // A aba NÃO será fechada.
        } else {
            const erro = await response.json().catch(() => ({mensagem: response.statusText}));
            setStatus("status-error", `Erro do servidor (${response.status}): ${erro.mensagem || response.statusText}. Tente novamente.`);
            desativarBotoes(false);
        }
    } catch (error) {
        setStatus("status-error", `Erro de rede: ${error.message}. Verifique sua conexão ou se o Render está online.`);
        desativarBotoes(false);
    }
}

// --- 4. LISTENERS DE AÇÃO (sem alterações) ---

// 1. Botão Chamar Consultório
btnConsultorio.addEventListener('click', () => {
    const inputConsultorio = document.getElementById('input-consultorio').value.trim();
    
    if (!inputConsultorio || isNaN(parseInt(inputConsultorio))) {
        setStatus("status-error", "Por favor, digite um NÚMERO válido para o Consultório.");
        return;
    }
    
    const destinoFinal = `CONSULTÓRIO ${inputConsultorio}`;
    enviarChamada(destinoFinal);
});

// 2. Botão Chamar Serviço
btnServico.addEventListener('click', () => {
    const selectServico = document.getElementById('select-servico');
    const servicoSelecionado = selectServico.value;
    
    if (!servicoSelecionado) {
        setStatus("status-error", "Por favor, selecione um Serviço na lista.");
        return;
    }
    
    enviarChamada(servicoSelecionado);
});
