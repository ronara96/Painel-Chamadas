// content.js - VERSÃO 2.0 (Comunicação com Pop-up)
console.log("ROBÔ EXTENSÃO VERSÃO 2.0 - Usando Pop-up para seleção de destino.");

// URL_ROBO_OBSERVADOR NÃO É MAIS NECESSÁRIO!

// --- XPATH UNIVERSAL PARA NOMES E BOTÕES ---
const XPATH_TODOS_OS_NOMES = '//*[@id=\"root\"]/div/div[3]/main/div[2]/div/div/div[2]/div/div[1]/div/div/div/div[*]/div/div[2]/div[1]/div/div[2]/div/div[2]/div[1]/span';
const XPATH_TODOS_OS_BOTOES_MENU = '//*[@id=\"root\"]/div/div[3]/main/div[2]/div/div/div[2]/div/div[1]/div/div/div/div[*]//*[self::button or @role=\"button\"][1]';

// --- XPATH FORNECIDO PARA UNIDADE ---
const XPATH_NOME_DA_UNIDADE = '//*[@id=\"root\"]/div/div[3]/div[1]/header/div/div/div/div[3]/div/div/div[2]/div'; 


function getUnidadeID() {
    try {
        const result = document.evaluate(XPATH_NOME_DA_UNIDADE, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        let unidade = result.singleNodeValue ? result.singleNodeValue.textContent.trim() : 'UNIDADE_PADRAO';
        // Limpeza simples para usar em URL/ID: remove espaços e caracteres especiais
        unidade = unidade.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
        return unidade;
    } catch (e) {
        console.error('Erro ao obter ID da Unidade (v2.0):', e);
        return 'UNIDADE_PADRAO';
    }
}

function enviarParaPopUp(chamada) {
    // 🚨 ALTERADO: Envia a chamada para o service worker (background.js)
    chrome.runtime.sendMessage({
        action: "abrirPopup",
        dados: chamada
    }, (response) => {
        // Resposta opcional do background.js
    });
}

function monitorarBotoes() {
    const unidadeID = getUnidadeID();
    const resultNomes = document.evaluate(XPATH_TODOS_OS_NOMES, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    const resultBotoes = document.evaluate(XPATH_TODOS_OS_BOTOES_MENU, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    
    const arrayDeNomes = [];
    for (let i = 0; i < resultNomes.snapshotLength; i++) {
        arrayDeNomes.push(resultNomes.snapshotItem(i));
    }

    // Adiciona listener APENAS nos botões que correspondem a um nome
    for (let index = 0; index < resultBotoes.snapshotLength; index++) {
        const botao = resultBotoes.snapshotItem(index);
        
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
    }
}

// Observador para garantir que a função rode sempre que a lista for atualizada
const observer = new MutationObserver(monitorarBotoes);
observer.observe(document.body, { childList: true, subtree: true });

// Executa a função uma vez quando a página carrega
monitorarBotoes();