// background.js (Service Worker)

let dadosChamadaGlobal = {};

// Escuta mensagens do content.js (quando o botão 'Chamar' é clicado)
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "abrirPopup") {
            // 1. Armazena os dados
            dadosChamadaGlobal = request.dados;
            
            // 2. Notifica o usuário visualmente sobre os dados capturados
            if (sender.tab && sender.tab.id) {
                // Adiciona um selo/badge vermelho (!)
                chrome.action.setBadgeText({ tabId: sender.tab.id, text: "!" });
                chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: "#FF0000" });
                
                // Muda o título ao passar o mouse sobre o ícone
                chrome.action.setTitle({ 
                    tabId: sender.tab.id, 
                    title: "Pronto para chamar: " + request.dados.paciente 
                });
            }
            
            // 3. Define o popup, mas o usuário ainda precisa clicar no ícone
            chrome.action.setPopup({ tabId: sender.tab.id, popup: "popup.html" });
            
            sendResponse({status: "dados prontos"});
        }
        
        // Permite que o popup.js solicite os dados armazenados ao carregar
        if (request.action === "obterDadosChamada") {
            sendResponse({dados: dadosChamadaGlobal});
            
            // Limpa o badge e o título APÓS o popup ser carregado
            if (sender.tab && sender.tab.id) {
                chrome.action.setBadgeText({ tabId: sender.tab.id, text: "" });
                chrome.action.setTitle({ tabId: sender.tab.id, title: "Enviar Chamada" });
            }
        }
        
        // Retorna true para manter o canal de mensagem aberto para chamadas assíncronas
        return true; 
    }
);
