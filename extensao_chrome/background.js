// background.js (Service Worker)

let dadosChamadaGlobal = {};

// Escuta mensagens do content.js (quando o botão 'Chamar' é clicado)
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "abrirPopup") {
            // 1. Armazena os dados
            dadosChamadaGlobal = request.dados;
            
            // 2. Abre o pop-up da extensão.
            chrome.action.openPopup(); 
            
            // CORREÇÃO: sendResponse e return true foram removidos para evitar o erro de canal fechado!
        }
        
        // Permite que o popup.js solicite os dados armazenados ao carregar
        if (request.action === "obterDadosChamada") {
            sendResponse({dados: dadosChamadaGlobal});
            
            // O retorno é síncrono, então não precisamos de return true.
        }
        
        // A função não tem 'return true' no final.
    }
);
