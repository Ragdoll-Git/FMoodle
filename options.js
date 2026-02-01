const statusDiv = document.getElementById('status');

// Guardar claves
document.getElementById('save').addEventListener('click', () => {
  const geminiKey = document.getElementById('apiKey').value.trim();
  const groqKey = document.getElementById('groqApiKey').value.trim();
  const openaiKey = document.getElementById('openaiApiKey').value.trim();
  const claudeKey = document.getElementById('claudeApiKey').value.trim();

  if (!geminiKey && !groqKey && !openaiKey && !claudeKey) {
    statusDiv.style.color = 'red';
    statusDiv.textContent = 'Debes ingresar al menos una clave.';
    return;
  }

  chrome.storage.sync.set({
    GEMINI_API_KEY: geminiKey,
    GROQ_API_KEY: groqKey,
    OPENAI_API_KEY: openaiKey,
    CLAUDE_API_KEY: claudeKey
  }, () => {
    statusDiv.style.color = 'green';
    statusDiv.textContent = '¡Configuración guardada correctamente!';
    setTimeout(() => statusDiv.textContent = '', 2000);
  });
});

// Cargar claves
chrome.storage.sync.get(['GEMINI_API_KEY', 'GROQ_API_KEY', 'OPENAI_API_KEY', 'CLAUDE_API_KEY'], (items) => {
  if (items.GEMINI_API_KEY) document.getElementById('apiKey').value = items.GEMINI_API_KEY;
  if (items.GROQ_API_KEY) document.getElementById('groqApiKey').value = items.GROQ_API_KEY;
  if (items.OPENAI_API_KEY) document.getElementById('openaiApiKey').value = items.OPENAI_API_KEY;
  if (items.CLAUDE_API_KEY) document.getElementById('claudeApiKey').value = items.CLAUDE_API_KEY;
});

// Fondo Aleatorio
const backgrounds = [
  'images/backgroundForOptions.jpg',
  'images/background2ForOptions.jpg'
];
const randomBg = backgrounds[Math.floor(Math.random() * backgrounds.length)];
document.body.style.backgroundImage = `url('${randomBg}')`;