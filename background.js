// background.js - Versión 3.2 (Arquitectura Ping-Pong)
import { askGroq } from './groq.js';

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";

const MAX_RETRIES = 2;
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

// 2. INYECCIÓN INTELIGENTE (EL FIX PRINCIPAL)
async function iniciarProceso(tab) {
    if (!tab.id || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) return;

    // PASO A: ¿Ya está vivo el script? (Hacemos Ping)
    try {
        await chrome.tabs.sendMessage(tab.id, { action: "ping" });
        // Si llegamos aquí, el script RESPONDIÓ "pong". No hace falta inyectar.
        console.log("⚡ Script ya activo en Tab", tab.id);
        captureScreenAndPrepareQuestion(tab.id);
    } catch (error) {
        // PASO B: Si falla el ping, INYECTAMOS.
        console.log("Inyectando script en Tab", tab.id);
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['prompts.js', 'content.js']
            });
            // Esperamos un momento para que se registre el listener
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

// 5. LÓGICA DE PROCESAMIENTO (Gemini/Groq)
async function processQuestionRouter(tabId, question, provider = 'gemini') {
    const base64ImageData = temporaryScreenshots[tabId];
    if (!base64ImageData) { sendMessageToContentScript(tabId, { action: "showError", message: "Imagen caducada." }); return; }

    if (provider === 'groq') {
        chrome.storage.sync.get(['GROQ_API_KEY'], async (items) => {
            if (!items.GROQ_API_KEY) { sendMessageToContentScript(tabId, { action: "showError", message: "Falta Groq API Key." }); return; }
            const result = await askGroq(question, base64ImageData, items.GROQ_API_KEY);
            delete temporaryScreenshots[tabId];
            result.success ? sendMessageToContentScript(tabId, { action: "showSummary", summary: result.text, model: result.model })
                : sendMessageToContentScript(tabId, { action: "showError", message: result.error });
        });
        return;
    }
    processQuestionWithGeminiOriginal(tabId, question, base64ImageData);
}



// 7. GEMINI LEGACY
async function processQuestionWithGeminiOriginal(tabId, question, base64) {
    chrome.storage.sync.get(['GEMINI_API_KEY', 'GROQ_API_KEY'], async (items) => {
        const k = items.GEMINI_API_KEY;
        if (!k) { sendMessageToContentScript(tabId, { action: "showError", message: "Falta Gemini API Key." }); return; }

        const p = { contents: [{ parts: [{ text: question }, { inlineData: { mimeType: "image/png", data: base64 } }] }] };

        // Iniciar Keep-Alive Heartbeat
        const keepAliveInterval = setInterval(() => {
            chrome.tabs.sendMessage(tabId, { action: "keepAlive" }).catch(() => { });
        }, 20000);

        try {
            // 1. Intentar Gemini 3.0 Flash Preview
            let responseModel = "Gemini 3 Flash Preview";
            let r = await fetchWithBackoff(`${GEMINI_BASE_URL}gemini-3-flash-preview:generateContent?key=${k}`, p);

            // 2. Fallback a Gemini 2.5 Flash
            if (!r.ok && r.status >= 500) {
                console.log("Fallo Gemini 3 Preview, intentando 2.5...");
                responseModel = "Gemini 2.5 Flash";
                r = await fetchWithBackoff(`${GEMINI_BASE_URL}gemini-2.5-flash:generateContent?key=${k}`, p);
            }

            if (!r.ok) throw new Error((await r.json()).error?.message || "Error Gemini");

            const res = await r.json();
            delete temporaryScreenshots[tabId];
            sendMessageToContentScript(tabId, { action: "showSummary", summary: res.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta.", model: responseModel });

        } catch (e) {
            console.error("Fallo Gemini:", e);

            // 3. Último recurso: Fallback a GROQ
            if (items.GROQ_API_KEY) {
                console.log("Intentando fallback a Groq...");
                // Notificar al usuario que estamos cambiando de proveedor
                chrome.tabs.sendMessage(tabId, { action: "showLoading", message: "Gemini falló. Intentando con Groq..." }).catch(() => { });

                try {
                    const groqRes = await askGroq(question, base64, items.GROQ_API_KEY);
                    delete temporaryScreenshots[tabId];

                    if (groqRes.success) {
                        sendMessageToContentScript(tabId, { action: "showSummary", summary: groqRes.text, model: `Fallback: ${groqRes.model}` });
                    } else {
                        throw new Error(groqRes.error || "Groq también falló");
                    }
                } catch (groqErr) {
                    sendMessageToContentScript(tabId, { action: "showError", message: `Todo falló (Gemini & Groq): ${groqErr.message}` });
                }
            } else {
                sendMessageToContentScript(tabId, { action: "showError", message: `Gemini Error: ${e.message}. (Agrega Groq Key para fallback)` });
            }
        } finally {
            clearInterval(keepAliveInterval);
        }
    });
}
async function fetchWithBackoff(url, pay, retries = 2) {
    try { const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pay) }); if (!r.ok && r.status >= 500) throw new Error(); return r; }
    catch (e) { if (retries > 0) { await new Promise(r => setTimeout(r, 2000)); return fetchWithBackoff(url, pay, retries - 1); } throw e; }
}

// 8. ENVÍO ROBUSTO (REINTENTOS)
function sendMessageToContentScript(tabId, message, retries = 5) {
    chrome.tabs.sendMessage(tabId, message).catch(async () => {
        if (retries > 0) { await new Promise(r => setTimeout(r, 300)); sendMessageToContentScript(tabId, message, retries - 1); }
        else console.warn("Falló envío final a Content Script.");
    });
}