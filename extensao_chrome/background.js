// background.js (Service Worker) - VERSÃO 4.0 (Abre Nova Aba)

let dadosChamadaGlobal = {};

// Escuta mensagens do content.js para abrir a nova aba
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "abrirNovaAba") {
            // 1. Armazena os dados
            dadosChamadaGlobal = request.dados;
            
            // 2. Abre uma nova ABA que usa o arquivo 'painel_tab.html' (que é o seu popup.html)
            chrome.tabs.create({ 
                url: chrome.runtime.getURL("painel_tab.html") 
            });
        }
        
        // Permite que o código da nova aba solicite os dados armazenados
        if (request.action === "obterDadosChamada") {
            sendResponse({dados: dadosChamadaGlobal});
        }
        
        // Não é necessário retornar 'true' aqui, pois não há chamadas assíncronas no background.
    }
);