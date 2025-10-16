// content.js - VERSÃO 2.0 (Comunicação com Pop-up)
console.log("ROBÔ EXTENSÃO VERSÃO 2.0 - Usando Pop-up para seleção de destino.");

// ... (Restante das variáveis e XPATHs) ...

function enviarParaPopUp(chamada) {
    // CORREÇÃO: Chamamos sendMessage SEM um callback (segundo argumento), 
    // pois não esperamos resposta e isso elimina o erro.
    chrome.runtime.sendMessage({ action: "abrirPopup", dados: chamada });
}

// ... (Restante do código: monitorarBotoes e MutationObserver) ...
