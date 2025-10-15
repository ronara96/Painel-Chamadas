// content.js - VERSÃO 2.0 (Comunicação com Pop-up)
console.log("ROBÔ EXTENSÃO VERSÃO 2.0 - Usando Pop-up para seleção de destino.");

// URL_ROBO_OBSERVADOR NÃO É MAIS NECESSÁRIO!

// --- XPATH UNIVERSAL PARA NOMES E BOTÕES ---
const XPATH_TODOS_OS_NOMES = '//*[@id="root"]/div/div[3]/main/div[2]/div/div/div[2]/div/div[1]/div/div/div/div[*]/div/div[2]/div[1]/div/div[2]/div/div[2]/div[1]/span';
const XPATH_TODOS_OS_BOTOES_MENU = '//*[@id="root"]/div/div[3]/main/div[2]/div/div/div[2]/div/div[1]/div/div/div/div[*]//*[self::button or @role="button"][1]';

// --- XPATH FORNECIDO PARA UNIDADE ---
const XPATH_NOME_DA_UNIDADE = '//*[@id="root"]/div/div[3]/div[1]/header/div/div/div/div[3]/div/div/div[2]/div'; 


function getUnidadeID() {
    try {
        const result = document.evaluate(XPATH_NOME_DA_UNIDADE, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        let unidade = result.singleNodeValue ? result.singleNodeValue.textContent.trim() : 'UNIDADE_PADRAO';
        
        // Formata para ser uma ID amigável (sem espaços ou caracteres especiais)
        // Ex: "UBS CENTRO" -> "UBS_CENTRO"
        return unidade.toUpperCase().replace(/[^A-Z0-9]+/g, '_'); 

    } catch (e) {
        console.error('Erro ao buscar UNIDADE ID:', e);
        return 'UNIDADE_PADRAO';
    }
}

function enviarParaPopUp(dadosChamada) {
    // Envia a mensagem para o Service Worker (background.js) com os dados
    // O Service Worker irá armazenar e abrir o pop-up
    chrome.runtime.sendMessage({ action: "abrirPopup", dados: dadosChamada });
}

// --- LÓGICA DO ROBÔ DE MONITORAMENTO ---
function monitorarBotoes() {
    const unidadeID = getUnidadeID();
    
    // 1. Coleta todos os nomes (para saber qual paciente está sendo chamado)
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
                        
                        enviarParaPopUp(chamada);
                        console.log(`Dados encontrados (v2.0): Unidade: ${unidadeID} | Paciente: ${paciente}`);
                        
                    } else {
                        console.error(`Erro (v2.0): Botão na posição ${index} clicado, mas nenhum nome correspondente foi encontrado.`);
                    }

                } catch (e) {
                    console.error('Erro ao processar clique (v2.0):', e);
                }
            });
        }
    });
}

// Observador para garantir que a função rode sempre que a lista for atualizada
const observer = new MutationObserver(monitorarBotoes);
observer.observe(document.body, { childList: true, subtree: true });

// Executa a função uma vez quando a página carrega
monitorarBotoes();