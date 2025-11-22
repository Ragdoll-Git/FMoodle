// background.js - Versión Modular (Gemini + Groq)
import { askGroq } from './groq.js';

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";

// ALMACENAMIENTO TEMPORAL
let temporaryScreenshots = {};

// CONFIGURACIÓN RETRIES (Gemini)
const MAX_RETRIES = 2; 
const BASE_DELAY = 2000;

// 1. INSTALACIÓN Y MENÚS
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: "askGeminiAboutScreen", title: "Preguntar a la IA sobre esta pantalla", contexts: ["page", "selection", "image"] });
});

chrome.contextMenus.onClicked.addListener((info, tab) => { if (info.menuItemId === "askGeminiAboutScreen") iniciarProceso(tab); });

chrome.commands.onCommand.addListener((command) => {
  if (command === "activar-captura") {
    chrome.tabs.query({active: true, lastFocusedWindow: true}, (tabs) => { if (tabs?.length > 0) iniciarProceso(tabs[0]); });
  }
});

// 2. INYECCIÓN
async function iniciarProceso(tab) {
    if (!tab.id || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) return;
    try {
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['prompts.js', 'content.js'] });
    } catch (err) {}
    captureScreenAndPrepareQuestion(tab.id);
}

// 3. COMUNICACIÓN (ROUTER)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "sendQuestionToGemini") {
    // Recibimos 'provider' desde content.js ('gemini' o 'groq')
    processQuestionRouter(sender.tab.id, request.question, request.provider);
    sendResponse({ status: "processing" });
  }
});

// 4. CAPTURA
function captureScreenAndPrepareQuestion(tabId) {
  chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
    if (chrome.runtime.lastError || !dataUrl) {
      sendMessageToContentScript(tabId, { action: "showError", message: "Error captura. Recarga la página." });
      return;
    }
    temporaryScreenshots[tabId] = dataUrl.split(',')[1];
    sendMessageToContentScript(tabId, { action: "showQuestionInput" }); 
  });
}

// 5. PROCESAMIENTO PRINCIPAL (ROUTER)
async function processQuestionRouter(tabId, question, provider = 'gemini') {
    const base64ImageData = temporaryScreenshots[tabId];
    
    if (!base64ImageData) {
        sendMessageToContentScript(tabId, { action: "showError", message: "La imagen ha caducado. Captura nuevamente." });
        return;
    }

    // --- RUTA A: GROQ ---
    if (provider === 'groq') {
        chrome.storage.sync.get(['GROQ_API_KEY'], async (items) => {
            if (!items.GROQ_API_KEY) {
                sendMessageToContentScript(tabId, { action: "showError", message: "Falta Groq API Key. Configúrala en Opciones." });
                return;
            }
            
            // Usamos el módulo externo
            const result = await askGroq(question, base64ImageData, items.GROQ_API_KEY);
            delete temporaryScreenshots[tabId]; // Limpieza

            if (result.success) {
                sendMessageToContentScript(tabId, { action: "showSummary", summary: result.text, model: result.model });
            } else {
                sendMessageToContentScript(tabId, { action: "showError", message: result.error });
            }
        });
        return; 
    }

    // --- RUTA B: GEMINI (Lógica original) ---
    processQuestionWithGeminiOriginal(tabId, question, base64ImageData);
}

// --- LÓGICA GEMINI ORIGINAL (Refactorizada para recibir imagen) ---
async function processQuestionWithGeminiOriginal(tabId, question, base64ImageData) {
  chrome.storage.sync.get(['GEMINI_API_KEY'], async (items) => {
      const apiKey = items.GEMINI_API_KEY;
      if (!apiKey) {
          sendMessageToContentScript(tabId, { action: "showError", message: "Falta Gemini API Key. Ve a Opciones." });
          return;
      }

      const payload = {
          contents: [{ parts: [{ text: question }, { inlineData: { mimeType: "image/png", data: base64ImageData } }] }]
      };

      const PRIMARY_MODEL = "gemini-2.5-flash";
      const FALLBACK_MODEL = "gemini-2.5-flash-lite";
      let usedModel = PRIMARY_MODEL;

      try {
        console.log(`Intentando con ${PRIMARY_MODEL}...`);
        let response = await fetchWithBackoff(`${GEMINI_BASE_URL}${PRIMARY_MODEL}:generateContent?key=${apiKey}`, payload);

        if (!response.ok && (response.status >= 500 || response.status === 429 || response.status === 503)) {
            console.warn(`Fallo ${PRIMARY_MODEL}. Cambiando a respaldo...`);
            usedModel = FALLBACK_MODEL;
            response = await fetchWithBackoff(`${GEMINI_BASE_URL}${FALLBACK_MODEL}:generateContent?key=${apiKey}`, payload);
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `Error ${response.status}`);
        }

        const result = await response.json();
        delete temporaryScreenshots[tabId]; 

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
        let msg = error.message || "";
        if (msg.includes("429") || msg.includes("503") || msg.includes("Server Error")) {
            msg = "Servicios saturados. Espera un momento.";
        } else if (msg.includes("not found") || msg.includes("404")) {
            msg = "Modelo Gemini no disponible.";
        }
        sendMessageToContentScript(tabId, { action: "showError", message: msg });
      }
  });
}

// FETCH CON BACKOFF (Solo para Gemini)
async function fetchWithBackoff(url, payload, retries = MAX_RETRIES, delay = BASE_DELAY) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok && (response.status === 429 || response.status >= 500)) {
            throw new Error(`Server Error ${response.status}`);
        }
        return response; 
    } catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithBackoff(url, payload, retries - 1, delay * 2);
        }
        throw error; 
    }
}

function sendMessageToContentScript(tabId, message) {
  chrome.tabs.sendMessage(tabId, message).catch(() => console.log("Pestaña desconectada"));
}