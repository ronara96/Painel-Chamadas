// content.js - VERSÃO 4.0 (Comunicação com Nova Aba)

console.log("ROBÔ EXTENSÃO VERSÃO 4.0 - Usando Nova Aba para seleção de destino.");

// --- XPATHs FINAIS E UNIVERSAIS CORRIGIDOS ---
// 1. XPATH UNIVERSAL PARA NOME DO PACIENTE
const XPATH_TODOS_OS_NOMES = '//*[@id="root"]/div/div[3]/main/div[2]/div/div/div[2]/div/div[1]/div/div/div/div[*]/div/div[2]/div[1]/div/div[2]/div/div[2]/div[1]/span';

// 2. XPATH UNIVERSAL PARA O BOTÃO 'CHAMAR'
const XPATH_TODOS_OS_BOTOES_MENU = '//*[@id="root"]/div/div[3]/main/div[2]/div/div/div[2]/div/div[1]/div/div/div/div[*]/div/div[2]/div[3]/div/div/button[2]';

// 3. XPATH ESPECÍFICO PARA A UNIDADE (Título)
const XPATH_NOME_DA_UNIDADE = '//*[@id="root"]/div/div[3]/div[1]/header/div/div/div/div[2]/div/div/div[2]/div/p'; 


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

function enviarParaBackground(dadosChamada) {
    // Ação: Pede para o background abrir a NOVA ABA
    chrome.runtime.sendMessage({ action: "abrirNovaAba", dados: dadosChamada });
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
                try {
                    const nomeElement = arrayDeNomes[index];
                    
                    if (nomeElement) {
                        const paciente = nomeElement.textContent.trim();
                        const chamada = { 
                            paciente: paciente, 
                            unidade_id: unidadeID,
                            profissional: 'Não Informado' 
                        };
                        
                        enviarParaBackground(chamada);
                        console.log(`Dados para Nova Aba: Unidade: ${unidadeID} | Paciente: ${paciente}`);
                        
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

// Inicialização e Observador
const observer = new MutationObserver(monitorarBotoes);
observer.observe(document.body, { childList: true, subtree: true });
monitorarBotoes();