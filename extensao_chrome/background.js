// background.js (Service Worker)

let dadosChamadaGlobal = {};

// Escuta mensagens do content.js (quando o botão 'Chamar' é clicado)
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "abrirPopup") {
            // 1. Armazena os dados
            dadosChamadaGlobal = request.dados;
            
            // 2. Abre o pop-up da extensão (Ação padrão para MV3)
            chrome.action.openPopup(); 
            
            sendResponse({status: "aberto"});
        }
        
        // Permite que o popup.js solicite os dados armazenados ao carregar
        if (request.action === "obterDadosChamada") {
            sendResponse({dados: dadosChamadaGlobal});
        }
        
        // Retorna true para manter o canal de mensagem aberto para chamadas assíncronas
        return true; 
    }
);