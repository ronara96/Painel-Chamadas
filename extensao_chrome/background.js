// background.js (Service Worker)

let dadosChamadaGlobal = {};

// Escuta mensagens do content.js (quando o botão 'Chamar' é clicado)
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "abrirPopup") {
            // 1. Armazena os dados
            dadosChamadaGlobal = request.dados;
            
            // 2. Abre o pop-up (Tentativa que você quer)
            chrome.action.openPopup(); 
            
            // REMOVEMOS: sendResponse({status: "aberto"});
            // REMOVEMOS: return true; 
            // Estes dois estavam causando o erro de canal fechado!
        }
        
        // Permite que o popup.js solicite os dados armazenados ao carregar
        if (request.action === "obterDadosChamada") {
            sendResponse({dados: dadosChamadaGlobal});
        }
        
        // Não há 'return true' no final.
    }
);
