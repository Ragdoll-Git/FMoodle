// background.js - Versión 3.5 (Robustez Total + Fallbacks)
import { askGroq } from './groq.js';
import { askOpenAI } from './openai.js';
import { askClaude } from './claude.js';

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
const MAX_RETRIES = 2; // Reintentos de red
const BASE_DELAY = 2000;

let temporaryScreenshots = {};

// 1. EVENTOS
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({ id: "askGeminiAboutScreen", title: "Preguntar a la IA sobre esta pantalla", contexts: ["page", "selection", "image"] });
});

chrome.contextMenus.onClicked.addListener((info, tab) => { if (info.menuItemId === "askGeminiAboutScreen") iniciarProceso(tab); });

chrome.commands.onCommand.addListener((command) => {
    if (command === "activar-captura") {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => { if (tabs?.length > 0) iniciarProceso(tabs[0]); });
    }
});

// 2. INYECCIÓN INTELIGENTE
async function iniciarProceso(tab) {
    if (!tab.id || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) return;

    try {
        await chrome.tabs.sendMessage(tab.id, { action: "ping" });
        console.log("⚡ Script ya activo en Tab", tab.id);
        captureScreenAndPrepareQuestion(tab.id);
    } catch (error) {
        console.log("Inyectando script en Tab", tab.id);
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['prompts.js', 'content.js']
            });
            setTimeout(() => captureScreenAndPrepareQuestion(tab.id), 500);
        } catch (err) {
            console.error("Falló inyección:", err);
        }
    }
}

// 3. ROUTER DE MENSAJES
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const tabId = sender.tab?.id;
    if (request.action === "sendQuestionToGemini") {
        processQuestionRouter(tabId, request.question, request.provider);
        sendResponse({ status: "processing" });
    }
});

// 4. CAPTURA Y ENVÍO
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

// --- UTILIDAD DE ROBUSTEZ: FETCH CON RETRY ---
async function fetchWithRetry(url, options, retries = MAX_RETRIES, backoff = 1000) {
    try {
        const response = await fetch(url, options);
        // Manejamos 429 (Too Many Requests) o 5xx (Server Error) como reintentables.
        if (!response.ok && (response.status === 429 || response.status >= 500)) {
            throw new Error(`Server Error ${response.status}`);
        }
        return response;
    } catch (error) {
        if (retries > 0) {
            console.warn(`Reintentando request (${retries} restantes)... Error: ${error.message}`);
            await new Promise(r => setTimeout(r, backoff));
            return fetchWithRetry(url, options, retries - 1, backoff * 2);
        }
        throw error;
    }
}

// 5. LÓGICA DE PROCESAMIENTO CENTRALIZADA
async function processQuestionRouter(tabId, question, provider = 'gemini') {
    const base64ImageData = temporaryScreenshots[tabId];
    if (!base64ImageData) { sendMessageToContentScript(tabId, { action: "showError", message: "Imagen caducada." }); return; }

    try {
        let result;

        if (provider === 'gemini') {
            // Gemini ya tiene su lógica de fallback compleja interna, la llamamos directa
            await processQuestionWithGeminiOriginal(tabId, question, base64ImageData);
            return; 
        } 
        else if (provider === 'groq') {
            const apiKey = (await chrome.storage.sync.get(['GROQ_API_KEY'])).GROQ_API_KEY;
            if (!apiKey) throw new Error("Falta Groq API Key.");
            result = await askGroq(question, base64ImageData, apiKey); // Groq debería usar fetchWithRetry internamente si es posible, pero aquí envolvemos la llamada
        }
        else if (provider === 'openai') {
            const apiKey = (await chrome.storage.sync.get(['OPENAI_API_KEY'])).OPENAI_API_KEY;
            if (!apiKey) throw new Error("Falta OpenAI API Key.");
            result = await askOpenAI(question, base64ImageData, apiKey);
        }
        else if (provider === 'claude') {
            const apiKey = (await chrome.storage.sync.get(['CLAUDE_API_KEY'])).CLAUDE_API_KEY;
            if (!apiKey) throw new Error("Falta Claude API Key.");
            result = await askClaude(question, base64ImageData, apiKey);
        }

        // Procesar resultado exitoso
        if (result.success) {
            delete temporaryScreenshots[tabId];
            sendMessageToContentScript(tabId, { action: "showSummary", summary: result.text, model: result.model });
        } else {
            throw new Error(result.error || "Error desconocido del proveedor");
        }

    } catch (error) {
        console.warn(`Fallo primario con ${provider}:`, error);
        
        // ESTRATEGIA DE FALLBACK UNIVERSAL (Si no es Gemini, que ya tiene la suya)
        // Intentamos Groq si falló el proveedor principal y no era Groq
        if (provider !== 'groq' && provider !== 'gemini') {
            await universalFallbackToGroq(tabId, question, base64ImageData, error.message);
        } else {
            // Si ya era Groq o Gemini (que ya hizo sus fallbacks), mostramos el error final
            sendMessageToContentScript(tabId, { action: "showError", message: error.message });
        }
    }
}

// 6. FALLBACK UNIVERSAL A GROQ
async function universalFallbackToGroq(tabId, question, base64, originalError) {
    const items = await chrome.storage.sync.get(['GROQ_API_KEY']);
    if (!items.GROQ_API_KEY) {
        sendMessageToContentScript(tabId, { action: "showError", message: `Error: ${originalError}. (Agrega Groq Key para tener respaldo)` });
        return;
    }

    console.log("Iniciando Universal Fallback a Groq...");
    sendMessageToContentScript(tabId, { action: "showLoading", message: `Proveedor falló. Intentando Groq...` });

    try {
        const groqRes = await askGroq(question, base64, items.GROQ_API_KEY);
        if (groqRes.success) {
            delete temporaryScreenshots[tabId];
            sendMessageToContentScript(tabId, { action: "showSummary", summary: groqRes.text, model: `Fallback: ${groqRes.model}` });
        } else {
            throw new Error(groqRes.error || "Groq también falló");
        }
    } catch (e) {
        sendMessageToContentScript(tabId, { action: "showError", message: `Fallo total: ${originalError} -> ${e.message}` });
    }
}

// 7. GEMINI LEGACY (CON FETCH CON RETRY REINTEGRADO)
async function processQuestionWithGeminiOriginal(tabId, question, base64) {
    chrome.storage.sync.get(['GEMINI_API_KEY', 'GROQ_API_KEY'], async (items) => {
        const k = items.GEMINI_API_KEY;
        if (!k) { sendMessageToContentScript(tabId, { action: "showError", message: "Falta Gemini API Key." }); return; }

        const p = { contents: [{ parts: [{ text: question }, { inlineData: { mimeType: "image/png", data: base64 } }] }] };

        const keepAliveInterval = setInterval(() => {
            chrome.tabs.sendMessage(tabId, { action: "keepAlive" }).catch(() => { });
        }, 20000);

        try {
            let responseModel = "Gemini 3 Flash Preview";
            let r;
            
            // Intento 1: Gemini 3
            try {
                r = await fetchWithRetry(`${GEMINI_BASE_URL}gemini-3-flash-preview:generateContent?key=${k}`, 
                    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }
                );
            } catch (e) { r = { ok: false, status: 500 }; } // Forzar caída al siguiente

            // Intento 2: Gemini 2.5 Flash
            if (!r.ok) {
                console.log("Fallo Gemini 3, intentando 2.5...");
                responseModel = "Gemini 2.5 Flash";
                 try {
                    r = await fetchWithRetry(`${GEMINI_BASE_URL}gemini-2.5-flash:generateContent?key=${k}`, 
                        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }
                    );
                } catch (e) { r = { ok: false, status: 500 }; }
            }

            // Intento 3: Gemini 2.5 Lite
            if (!r.ok) {
                console.log("Fallo Gemini 2.5, intentando Lite...");
                responseModel = "Gemini 2.5 Lite";
                try {
                    r = await fetchWithRetry(`${GEMINI_BASE_URL}gemini-2.5-flash-lite:generateContent?key=${k}`, 
                        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }
                    );
                } catch (e) { r = { ok: false, status: 500 }; }
            }

            if (!r.ok) throw new Error("Todos los modelos Gemini fallaron.");

            const res = await r.json();
            delete temporaryScreenshots[tabId];
            sendMessageToContentScript(tabId, { action: "showSummary", summary: res.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta.", model: responseModel });

        } catch (e) {
            console.error("Fallo Gemini Cascada:", e);
            // Fallback final a Groq (usando la nueva función universal)
            await universalFallbackToGroq(tabId, question, base64, e.message);
        } finally {
            clearInterval(keepAliveInterval);
        }
    });
}

// 8. ENVÍO ROBUSTO
function sendMessageToContentScript(tabId, message, retries = 5) {
    chrome.tabs.sendMessage(tabId, message).catch(async () => {
        if (retries > 0) { await new Promise(r => setTimeout(r, 300)); sendMessageToContentScript(tabId, message, retries - 1); }
        else console.warn("Falló envío final a Content Script.");
    });
}