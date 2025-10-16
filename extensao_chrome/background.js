// background.js (Service Worker) - VERSÃO 4.1 (Reuso de Aba)

let dadosChamadaGlobal = {};
const painelUrl = chrome.runtime.getURL("painel_tab.html");
let painelTabId = null; // Armazenará o ID da aba do painel

// 1. Escuta mensagens do content.js (para abrir ou reusar a aba)
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "abrirNovaAba") {
            // 1. Armazena os dados
            dadosChamadaGlobal = request.dados;
            
            // 2. Procura por uma aba do Painel já aberta
            chrome.tabs.query({}, function(tabs) {
                // Encontra a aba que tem o painel_tab.html
                let abaEncontrada = tabs.find(tab => tab.url === painelUrl);
                
                if (abaEncontrada) {
                    // Aba JÁ existe: Reusa, recarrega e ativa
                    painelTabId = abaEncontrada.id;

                    // Ativa a aba (traz ela para o foco)
                    chrome.tabs.update(painelTabId, { selected: true }, function() {
                        // Recarrega o conteúdo da aba. Isso faz o painel_tab.js rodar de novo
                        // e buscar os 'dadosChamadaGlobal' atualizados.
                        chrome.tabs.reload(painelTabId);
                    });
                    
                } else {
                    // Aba NÃO existe: Cria uma nova
                    chrome.tabs.create({ url: painelUrl }, function(tab) {
                        painelTabId = tab.id;
                    });
                }
            });
        }
        
        // 3. Permite que o painel_tab.js solicite os dados armazenados
        if (request.action === "obterDadosChamada") {
            sendResponse({dados: dadosChamadaGlobal});
        }
    }
);