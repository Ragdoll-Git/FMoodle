// options.js
const statusDiv = document.getElementById('status');

// Guardar la clave
document.getElementById('save').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKey').value.trim();
  if (!apiKey) {
    statusDiv.style.color = 'red';
    statusDiv.textContent = 'La clave no puede estar vacía.';
    return;
  }
  
  chrome.storage.sync.set({ GEMINI_API_KEY: apiKey }, () => {
    statusDiv.style.color = 'green';
    statusDiv.textContent = '¡Clave guardada correctamente!';
    setTimeout(() => statusDiv.textContent = '', 2000);
  });
});

// Cargar la clave guardada al abrir
chrome.storage.sync.get(['GEMINI_API_KEY'], (items) => {
  if (items.GEMINI_API_KEY) {
    document.getElementById('apiKey').value = items.GEMINI_API_KEY;
  }
});