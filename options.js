// options.js - v3.5.0 (API Keys + Prompts Management)

const statusDiv = document.getElementById('status');

// === PROMPTS POR DEFECTO (mismos que prompts.js) ===
const DEFAULT_PROMPTS = [
    {
        title: "Tratamiento de Señal",
        text: "Sos un experto en transformadas de fourier, señales electricas (analogicas y digitales), matematica aplicada. Necesito que resuelvas profundizando y razonando bien los ejercicios siguientes, pero respondiendo de forma concisa, corta y clara, despues si queres dar una breve explicacion, hazlo debajo de la respuesta corta. El ejercicio es:"
    },
    {
        title: "Programacion C/C++",
        text: "Podes desarrollar el codigo en C, únicamente incluyendo en el codigo: 1. La libreria iostream (salvo caso indispensable de usar otra/s). 2. Variables lejibles y humanas. 3. cout, cin (using namespace std), int, float (no setear precision), no usar funciones (salvo si es indispensablemente necesario). 4. Sin comentarios, ni tampoco descripciones largas. El ejercicio es:"
    }
];

// === RENDER PROMPTS EN EL DOM ===
function renderPrompts(prompts) {
    const container = document.getElementById('promptsContainer');
    container.innerHTML = '';

    prompts.forEach((prompt, index) => {
        const card = document.createElement('div');
        card.className = 'prompt-card';

        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.value = prompt.title || '';
        titleInput.placeholder = 'Título del prompt...';
        titleInput.className = 'prompt-title-input';

        const textArea = document.createElement('textarea');
        textArea.value = prompt.text || '';
        textArea.placeholder = 'Texto del prompt...';
        textArea.className = 'prompt-text-input';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-prompt';
        deleteBtn.textContent = '✕';
        deleteBtn.type = 'button';
        deleteBtn.onclick = () => card.remove();

        card.append(deleteBtn, titleInput, textArea);
        container.appendChild(card);
    });
}

// === RECOLECTAR PROMPTS DESDE EL DOM ===
function collectPrompts() {
    const cards = document.querySelectorAll('.prompt-card');
    const prompts = [];
    cards.forEach(card => {
        const title = card.querySelector('.prompt-title-input')?.value.trim();
        const text = card.querySelector('.prompt-text-input')?.value.trim();
        if (title || text) {
            prompts.push({ title: title || 'Sin título', text: text || '' });
        }
    });
    return prompts;
}

// === AGREGAR PROMPT ===
document.getElementById('addPrompt').addEventListener('click', () => {
    const currentPrompts = collectPrompts();
    currentPrompts.push({ title: '', text: '' });
    renderPrompts(currentPrompts);
    // Focus en el último título agregado
    const inputs = document.querySelectorAll('.prompt-title-input');
    if (inputs.length > 0) inputs[inputs.length - 1].focus();
});

// === GUARDAR (Keys + Prompts) ===
document.getElementById('save').addEventListener('click', () => {
    const geminiKey = document.getElementById('apiKey').value.trim();
    const groqKey = document.getElementById('groqApiKey').value.trim();
    const openaiKey = document.getElementById('openaiApiKey').value.trim();
    const claudeKey = document.getElementById('claudeApiKey').value.trim();
    const customPrompts = collectPrompts();

    chrome.storage.sync.set({
        GEMINI_API_KEY: geminiKey,
        GROQ_API_KEY: groqKey,
        OPENAI_API_KEY: openaiKey,
        CLAUDE_API_KEY: claudeKey,
        CUSTOM_PROMPTS: customPrompts
    }, () => {
        statusDiv.style.color = 'green';
        statusDiv.textContent = '¡Configuración guardada correctamente!';
        setTimeout(() => statusDiv.textContent = '', 2000);
    });
});

// === CARGAR (Keys + Prompts) ===
chrome.storage.sync.get(['GEMINI_API_KEY', 'GROQ_API_KEY', 'OPENAI_API_KEY', 'CLAUDE_API_KEY', 'CUSTOM_PROMPTS'], (items) => {
    if (items.GEMINI_API_KEY) document.getElementById('apiKey').value = items.GEMINI_API_KEY;
    if (items.GROQ_API_KEY) document.getElementById('groqApiKey').value = items.GROQ_API_KEY;
    if (items.OPENAI_API_KEY) document.getElementById('openaiApiKey').value = items.OPENAI_API_KEY;
    if (items.CLAUDE_API_KEY) document.getElementById('claudeApiKey').value = items.CLAUDE_API_KEY;

    // Cargar prompts: custom desde storage, o defaults
    const prompts = items.CUSTOM_PROMPTS || DEFAULT_PROMPTS;
    renderPrompts(prompts);
});

// === FONDO ALEATORIO ===
const backgrounds = [
    'images/backgroundForOptions.jpg',
    'images/background2ForOptions.jpg'
];
const randomBg = backgrounds[Math.floor(Math.random() * backgrounds.length)];
document.body.style.backgroundImage = `url('${randomBg}')`;