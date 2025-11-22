const statusDiv = document.getElementById('status');

// Guardar claves
document.getElementById('save').addEventListener('click', () => {
  const geminiKey = document.getElementById('apiKey').value.trim();
  const groqKey = document.getElementById('groqApiKey').value.trim();
  
  if (!geminiKey && !groqKey) {
    statusDiv.style.color = 'red';
    statusDiv.textContent = 'Debes ingresar al menos una clave.';
    return;
  }
  
  chrome.storage.sync.set({ 
    GEMINI_API_KEY: geminiKey,
    GROQ_API_KEY: groqKey
  }, () => {
    statusDiv.style.color = 'green';
    statusDiv.textContent = '¡Configuración guardada correctamente!';
    setTimeout(() => statusDiv.textContent = '', 2000);
  });
});

// Cargar claves
chrome.storage.sync.get(['GEMINI_API_KEY', 'GROQ_API_KEY'], (items) => {
  if (items.GEMINI_API_KEY) document.getElementById('apiKey').value = items.GEMINI_API_KEY;
  if (items.GROQ_API_KEY) document.getElementById('groqApiKey').value = items.GROQ_API_KEY;
});