// background.js - Versión Final Segura (Inyección + API Key Dinámica)

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";

// 1. INSTALACIÓN
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: "askGeminiAboutScreen", title: "Preguntar a la IA sobre esta pantalla", contexts: ["page", "selection", "image"] });
});

// 2. EVENTOS (Click derecho y Teclado)
chrome.contextMenus.onClicked.addListener((info, tab) => { if (info.menuItemId === "askGeminiAboutScreen") iniciarProceso(tab); });

chrome.commands.onCommand.addListener((command) => {
  if (command === "activar-captura") {
    chrome.tabs.query({active: true, lastFocusedWindow: true}, (tabs) => {
      if (tabs?.length > 0) iniciarProceso(tabs[0]);
    });
  }
});

// 3. FUNCIÓN DE INYECCIÓN Y CAPTURA (NUEVO)
async function iniciarProceso(tab) {
    if (!tab.id || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) return;

    // Antes de capturar, inyectamos los scripts necesarios en la pestaña activa
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['prompts.js', 'content.js']
        });
    } catch (err) {
        // Si falla (ej: "Script already injected" que pusimos en content.js), lo ignoramos y seguimos.
        // Esto es normal si el usuario usa la extensión varias veces en la misma página.
    }

    // Una vez inyectado, procedemos a capturar
    captureScreenAndPrepareQuestion(tab.id);
}

// 4. COMUNICACIÓN
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "sendQuestionToGemini") {
    processQuestionWithGemini(sender.tab.id, request.question, request.base64ImageData);
    sendResponse({ status: "processing" });
  }
});

// 5. CAPTURA
function captureScreenAndPrepareQuestion(tabId) {
  chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
    if (chrome.runtime.lastError || !dataUrl) {
      sendMessageToContentScript(tabId, { action: "showError", message: "Error captura. Recarga la página." });
      return;
    }
    const base64ImageData = dataUrl.split(',')[1];
    sendMessageToContentScript(tabId, { action: "showQuestionInput", imageData: base64ImageData });
  });
}

// 6. PROCESAMIENTO (Con API Key dinámica)
async function processQuestionWithGemini(tabId, question, base64ImageData) {
  
  // LEER API KEY DEL ALMACENAMIENTO
  chrome.storage.sync.get(['GEMINI_API_KEY'], async (items) => {
      const apiKey = items.GEMINI_API_KEY;

      if (!apiKey) {
          sendMessageToContentScript(tabId, { action: "showError", message: "Falta la API Key. Ve a Opciones de la extensión y configúrala." });
          return;
      }

      const payload = {
          contents: [{ parts: [{ text: question }, { inlineData: { mimeType: "image/png", data: base64ImageData } }] }]
      };

      let usedModel = "gemini-2.5-flash"; 

      const tryFetch = async (modelName) => {
          const url = `${BASE_URL}${modelName}:generateContent?key=${apiKey}`; // Usamos la variable apiKey
          return await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
      };

      try {
        console.log("Intentando con modelo 2.5...");
        let response = await tryFetch("gemini-2.5-flash");

        if (response.status === 503 || response.status === 500) {
            usedModel = "gemini-1.5-flash";
            response = await tryFetch("gemini-1.5-flash");
        } else if (!response.ok) {
            const errorClone = response.clone();
            const errorData = await errorClone.json().catch(() => ({}));
            const errMsg = errorData.error?.message || "";
            if (errMsg.includes("overloaded") || errMsg.includes("quota")) {
                usedModel = "gemini-1.5-flash";
                response = await tryFetch("gemini-1.5-flash");
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || response.statusText);
        }

        const result = await response.json();
        
        if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
          sendMessageToContentScript(tabId, { 
              action: "showSummary", 
              summary: result.candidates[0].content.parts[0].text,
              model: usedModel 
          });
        } else {
          sendMessageToContentScript(tabId, { action: "showError", message: "La IA no generó texto." });
        }

      } catch (error) {
        sendMessageToContentScript(tabId, { action: "showError", message: error.message });
      }
  });
}

function sendMessageToContentScript(tabId, message) {
  chrome.tabs.sendMessage(tabId, message).catch(() => console.log("Pestaña desconectada"));
}