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

// 6. PROCESAMIENTO (Actualizado a Estándar Gemini 2.5 - Nov 2025)
async function processQuestionWithGemini(tabId, question, base64ImageData) {
  
  chrome.storage.sync.get(['GEMINI_API_KEY'], async (items) => {
      const apiKey = items.GEMINI_API_KEY;

      if (!apiKey) {
          sendMessageToContentScript(tabId, { action: "showError", message: "Falta la API Key. Ve a Opciones." });
          return;
      }

      const payload = {
          contents: [{ parts: [{ text: question }, { inlineData: { mimeType: "image/png", data: base64ImageData } }] }]
      };

      // ACTUALIZACIÓN SEGÚN CORREO DE MIGRACIÓN:
      // Usamos los modelos listados en la documentación oficial recibida.
      const PRIMARY_MODEL = "gemini-2.5-flash";        // Modelo estándar 
      const FALLBACK_MODEL = "gemini-2.5-flash-lite";  // Nuevo respaldo ligero 

      let usedModel = PRIMARY_MODEL;

      const tryFetch = async (modelName) => {
          // Mantenemos v1beta ya que suele tener los últimos checkpoints
          const url = `${BASE_URL}${modelName}:generateContent?key=${apiKey}`; 
          return await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
      };

      try {
        console.log(`Intentando con ${PRIMARY_MODEL}...`);
        let response = await tryFetch(PRIMARY_MODEL);

        // Lógica de Fallback Mejorada:
        // Si falla el 2.5 Flash (por error 503, 500, o incluso 404 si hubiera cambios raros),
        // saltamos al 2.5 Flash Lite que es más ligero y estable.
        if (!response.ok && (response.status >= 500 || response.status === 429 || response.status === 503)) {
            console.warn(`Fallo ${PRIMARY_MODEL}. Cambiando a respaldo: ${FALLBACK_MODEL}...`);
            usedModel = FALLBACK_MODEL;
            response = await tryFetch(FALLBACK_MODEL);
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
          sendMessageToContentScript(tabId, { 
              action: "showSummary", 
              summary: result.candidates[0].content.parts[0].text,
              model: usedModel 
          });
        } else {
          sendMessageToContentScript(tabId, { action: "showError", message: "La IA no generó respuesta." });
        }

      } catch (error) {
        console.error(error);
        // Mostramos un mensaje más amigable si el error es de "Not Found"
        let msg = error.message;
        if (msg.includes("not found")) msg = "Modelo no disponible. Verifica tu API Key o la región.";
        sendMessageToContentScript(tabId, { action: "showError", message: msg });
      }
  });
}

function sendMessageToContentScript(tabId, message) {
  chrome.tabs.sendMessage(tabId, message).catch(() => console.log("Pestaña desconectada"));
}