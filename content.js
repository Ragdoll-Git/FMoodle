// content.js - Versión Autolimpiable (Force Refresh)

(function () {
  console.log("Inicializando Gemini Content Script...");

  // 1. LIMPIEZA DE ZOMBIES
  // Si existe un listener anterior, lo matamos para que no haya duplicados.
  if (window.geminiListenerRef) {
    try { chrome.runtime.onMessage.removeListener(window.geminiListenerRef); } catch (e) { }
  }

  // 2. CONFIGURACIÓN
  var SUMMARY_CONTAINER_ID = 'gemini-summary-popup-container';
  var POSITION_STORAGE_KEY = 'geminiPopupPosition';

  // Variables de estado (se reinician en cada inyección)
  var isPinned = false;
  var isMinimized = false;
  var isMouseDown = false;
  var hasMoved = false;
  var dragOffsetX, dragOffsetY;
  var lastQuestionStartTime = 0; // Timer variable

  // Definimos la función del listener para poder referenciarla
  const messageListener = (request, sender, sendResponse) => {
    if (request.action === 'ping') {
      sendResponse({ status: "pong" });
    } else if (request.action === 'showLoading') {
      showPopup("Analizando tu pregunta...", true);
      sendResponse({ status: "ok" });
    } else if (request.action === 'showSummary') {
      const duration = ((Date.now() - lastQuestionStartTime) / 1000).toFixed(1);
      showPopup(request.summary, false, true, request.model, duration);
      sendResponse({ status: "ok" });
    } else if (request.action === 'showError') {
      showPopup(`Error: ${request.message}`, false, true);
      sendResponse({ status: "ok" });
    } else if (request.action === 'showQuestionInput') {
      // CAMBIO: Ya no leemos request.imageData
      if (isMinimized) {
        isMinimized = false;
      }
      showQuestionInputPopup();
      sendResponse({ status: "ok" });
    }
    return true;
  };

  chrome.runtime.onMessage.addListener(messageListener);
  window.geminiListenerRef = messageListener;

  // --- LÓGICA DE ESTADO VISUAL (NUEVA ARQUITECTURA) ---

  // 1. Cambia el estado (True/False) y aplica cambios
  function toggleMinimizeState(container) {
    isMinimized = !isMinimized;
    applyMinimizeState(container);
  }

  // 2. Solo aplica los cambios visuales según el estado actual
  function applyMinimizeState(container) {
    const header = container.querySelector('.gemini-header');
    const body = container.querySelector('.gemini-content-body');
    const restoreBtn = container.querySelector('.gemini-restore-btn');

    if (isMinimized) {
      // MODO MINIMIZADO (Burbuja)
      header.style.display = 'none';
      if (body) body.style.display = 'none';
      restoreBtn.style.display = 'flex';

      Object.assign(container.style, {
        width: 'auto', height: 'auto', background: 'transparent', border: 'none', boxShadow: 'none'
      });
    } else {
      // MODO RESTAURADO (Ventana normal)
      header.style.display = 'flex';
      restoreBtn.style.display = 'none';

      // --- SOLUCIÓN AL SCROLL ---
      // Recuperamos el modo de visualización correcto (block o flex)
      const displayType = body.dataset.displayMode || 'block';
      body.style.display = displayType;

      Object.assign(container.style, {
        width: '350px', background: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px rgba(0,0,0,0.1)'
      });
    }
  }

  // --- SHOW INPUT ---

  function showQuestionInputPopup() {
    createPopup((container, header) => {
      // header.querySelector('#gemini-popup-title').textContent = 'Pregunta a la IA';
      header.querySelector('#gemini-popup-title').style.display = 'none'; // Ocular titulo para dar espacio

      const extrasContainer = header.querySelector('#gemini-header-extras');
      if (extrasContainer) {
        extrasContainer.innerHTML = '';

        // 1. Selector PROMPTS (Igual que antes)
        if (typeof PREDEFINED_PROMPTS !== 'undefined') {
          const promptSelect = document.createElement('select');
          // ... (estilos del promptSelect igual que antes) ...
          Object.assign(promptSelect.style, { maxWidth: '100px', fontSize: '12px' }); // Ajuste visual

          PREDEFINED_PROMPTS.forEach(prompt => {
            const option = document.createElement('option');
            option.value = prompt.text; option.textContent = prompt.title;
            promptSelect.appendChild(option);
          });
          promptSelect.onchange = () => {
            const textArea = container.querySelector('textarea');
            if (textArea && promptSelect.value) { textArea.value = promptSelect.value; textArea.focus(); }
          };
          extrasContainer.appendChild(promptSelect);
        }

        // 2. Selector PROVEEDOR (Igual que antes)
        const providerSelect = document.createElement('select');
        providerSelect.id = 'gemini-provider-select';
        // ... (estilos y opciones igual que antes) ...
        const optGemini = document.createElement('option'); optGemini.value = 'gemini'; optGemini.textContent = 'Gemini';
        const optGroq = document.createElement('option'); optGroq.value = 'groq'; optGroq.textContent = 'Groq';
        const optOpenAI = document.createElement('option'); optOpenAI.value = 'openai'; optOpenAI.textContent = 'ChatGPT';
        providerSelect.append(optGemini, optGroq, optOpenAI);

        chrome.storage.local.get(['preferredProvider'], (data) => {
          if (data.preferredProvider) providerSelect.value = data.preferredProvider;
        });
        providerSelect.onchange = () => chrome.storage.local.set({ preferredProvider: providerSelect.value });
        extrasContainer.appendChild(providerSelect);
      }

      // Cuerpo del popup (Igual que antes)
      const contentDiv = document.createElement('div');
      contentDiv.className = 'gemini-content-body';
      contentDiv.dataset.displayMode = 'flex';
      Object.assign(contentDiv.style, { padding: '12px', display: 'flex', gap: '8px' });

      const questionInput = document.createElement('textarea');
      questionInput.placeholder = 'Escribe tu pregunta... (Shift+Enter salto de línea)';
      Object.assign(questionInput.style, { flex: '1', minHeight: '60px', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'inherit', resize: 'vertical' });
      setTimeout(() => questionInput.focus(), 100);

      const sendButton = document.createElement('button');
      sendButton.innerHTML = '&#9166;';
      Object.assign(sendButton.style, { backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', width: '40px', height: '40px', borderRadius: '6px', cursor: 'pointer', fontSize: '20px', flexShrink: '0' });

      // --- LÓGICA DE ENVÍO MODIFICADA ---
      const submitQuestion = () => {
        lastQuestionStartTime = Date.now(); // Start timer
        const question = questionInput.value.trim();
        const selectedProvider = header.querySelector('#gemini-provider-select')?.value || 'gemini';

        if (question) {
          showPopup("Analizando...", true);

          chrome.runtime.sendMessage({
            action: "sendQuestionToGemini",
            question: question,
            provider: selectedProvider
          });
        }
      };

      sendButton.onclick = submitQuestion;
      questionInput.onkeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitQuestion(); }
      };

      contentDiv.appendChild(questionInput);
      contentDiv.appendChild(sendButton);
      container.appendChild(contentDiv);
    });
  }

  // --- MODIFICACIÓN EN CLOSEPOPUP (IMPORTANTE) ---
  function closePopup(container) {
    // Avisar al background que pare el Live (ya no necesario, pero dejaremos close cleaner simple)


    if (isPinned) savePosition(container);
    container.style.opacity = '0';
    setTimeout(() => container.remove(), 300);
    isMinimized = false;
  }

  // --- SHOW POPUP (RESPUESTA) ---
  function showPopup(content, isLoading = false, isAnswer = false, modelName = '', duration = 0) {
    createPopup((container, header) => {
      const titleElement = header.querySelector('#gemini-popup-title');
      titleElement.style.display = 'block'; // Reset display just in case
      const extrasContainer = header.querySelector('#gemini-header-extras');
      if (extrasContainer) extrasContainer.innerHTML = '';

      if (isAnswer) {
        let version = "";
        if (modelName) {
          if (modelName.includes("3")) version = " (3.0 Flash Preview)";
          else if (modelName.includes("lite")) version = " (2.5 Lite)";
          else if (modelName.includes("2.5")) version = " (2.5 Flash)";
          else version = ` (${modelName})`;
        }
        titleElement.textContent = `Respuesta${version} (${duration}s)`;
      } else {
        titleElement.textContent = 'Procesando...';
      }

      const contentDiv = document.createElement('div');
      contentDiv.className = 'gemini-content-body';

      // La respuesta necesita BLOCK para que funcione el scroll
      contentDiv.dataset.displayMode = 'block';
      Object.assign(contentDiv.style, { padding: '12px', maxHeight: '300px', overflowY: 'auto', display: 'block', userSelect: 'text' });

      if (isLoading) {
        contentDiv.style.display = 'flex';
        contentDiv.dataset.displayMode = 'flex'; // El loading se ve mejor en flex
        const loaderContainer = document.createElement('div');
        loaderContainer.style.display = 'flex'; loaderContainer.style.alignItems = 'center';
        const loader = document.createElement('div');
        Object.assign(loader.style, { width: '1em', height: '1em', marginRight: '8px', border: '2px solid #9ca3af', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' });
        loaderContainer.appendChild(loader); loaderContainer.appendChild(document.createTextNode(content));
        contentDiv.appendChild(loaderContainer);
        if (!document.getElementById('gemini-spin-style')) {
          const styleSheet = document.createElement("style");
          styleSheet.id = 'gemini-spin-style'; styleSheet.innerText = `@keyframes spin { to { transform: rotate(360deg); } }`;
          document.head.appendChild(styleSheet);
        }
      } else {
        contentDiv.innerHTML = content.replace(/\n/g, '<br>');
      }
      container.appendChild(contentDiv);
    });
  }

  // --- CREATE POPUP ---
  function createPopup(onCreatedCallback) {
    let existingContainer = document.getElementById(SUMMARY_CONTAINER_ID);
    if (existingContainer) existingContainer.remove();

    const container = document.createElement('div');
    container.id = SUMMARY_CONTAINER_ID;
    Object.assign(container.style, {
      position: 'fixed', width: '350px', backgroundColor: '#ffffff', color: '#1f2937',
      border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
      zIndex: '2147483647', fontSize: '14px', display: 'flex', flexDirection: 'column', opacity: '0',
      transition: 'opacity 0.3s'
    });

    chrome.storage.local.get([POSITION_STORAGE_KEY], (data) => {
      if (data[POSITION_STORAGE_KEY]?.isPinned) {
        isPinned = true;
        const savedPos = data[POSITION_STORAGE_KEY].position;
        Object.assign(container.style, { left: savedPos.left, top: savedPos.top, transform: 'translate(0,0)' });
      } else {
        isPinned = false;
        Object.assign(container.style, { left: '50%', bottom: '20px', transform: 'translate(-50%, 0)' });
      }

      // BOTÓN FLOTANTE RESTAURAR (Tus estilos personalizados)
      const restoreBtn = document.createElement('div');
      restoreBtn.className = 'gemini-restore-btn';
      restoreBtn.innerHTML = '&#10530;';
      Object.assign(restoreBtn.style, {
        display: 'none', width: '40px', height: '40px',
        backgroundColor: '#ffffff', color: 'black', border: '1px solid #dfdfdfff', // TUS ESTILOS
        borderRadius: '50%', justifyContent: 'center', alignItems: 'center',
        cursor: 'pointer', fontSize: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)', userSelect: 'none'
      });

      restoreBtn.onclick = (e) => {
        e.stopPropagation();
        if (hasMoved) return;
        toggleMinimizeState(container);
      };

      enableDrag(restoreBtn, container);
      container.appendChild(restoreBtn);

      const header = createDraggableHeader(container);
      header.className = 'gemini-header';
      container.appendChild(header);

      onCreatedCallback(container, header);
      document.body.appendChild(container);

      // --- APLICA EL ESTADO MINIMIZADO INMEDIATAMENTE ---
      // Si la variable dice que debe estar minimizado, lo aplicamos antes de mostrarlo.
      if (isMinimized) {
        applyMinimizeState(container);
      }

      setTimeout(() => {
        container.style.opacity = '1';
        // Ajuste de posición si no está fijado
        if (!isPinned && !isMinimized) container.style.transform = 'translate(-50%,0)';
      }, 10);
    });
  }

  function createDraggableHeader(container) {
    const header = document.createElement('div');
    Object.assign(header.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', cursor: 'move', borderRadius: '12px 12px 0 0', minHeight: '30px' });

    const leftContainer = document.createElement('div');
    leftContainer.style.display = 'flex'; leftContainer.style.alignItems = 'center'; leftContainer.style.flex = '1'; leftContainer.style.overflow = 'hidden';
    const title = document.createElement('span');
    title.id = 'gemini-popup-title'; title.style.fontWeight = '600'; title.style.whiteSpace = 'nowrap';
    const extrasDiv = document.createElement('div');
    extrasDiv.id = 'gemini-header-extras'; extrasDiv.style.marginLeft = '5px';
    leftContainer.append(title, extrasDiv);

    const controls = document.createElement('div');
    Object.assign(controls.style, { display: 'flex', alignItems: 'center', flexShrink: '0', marginLeft: '8px' });

    const minBtn = document.createElement('button');
    minBtn.innerHTML = '&minus;';
    Object.assign(minBtn.style, { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', marginRight: '4px', fontWeight: 'bold', padding: '0 4px' });
    minBtn.onclick = (e) => { e.stopPropagation(); toggleMinimizeState(container); };

    const pinBtn = document.createElement('button');
    pinBtn.innerHTML = '📌';
    Object.assign(pinBtn.style, { background: 'none', border: 'none', cursor: 'pointer', opacity: isPinned ? '1' : '0.4', padding: '0 4px' });
    pinBtn.onclick = (e) => { e.stopPropagation(); isPinned = !isPinned; pinBtn.style.opacity = isPinned ? '1' : '0.4'; isPinned ? savePosition(container) : chrome.storage.local.remove(POSITION_STORAGE_KEY); };

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    Object.assign(closeBtn.style, { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '0 4px' });
    closeBtn.onclick = (e) => { e.stopPropagation(); closePopup(container); };

    controls.append(minBtn, pinBtn, closeBtn);
    header.append(leftContainer, controls);

    enableDrag(header, container);

    return header;
  }

  // --- FUNCIÓN DRAG ---
  function enableDrag(element, container) {
    element.onmousedown = (e) => {
      if (e.target.closest('select') || (e.target.closest('button') && e.target !== element)) return;

      isMouseDown = true;
      hasMoved = false;

      const rect = container.getBoundingClientRect();
      if (container.style.bottom !== 'auto') {
        container.style.top = `${rect.top}px`; container.style.bottom = 'auto'; container.style.left = `${rect.left}px`; container.style.transform = 'translate(0,0)';
      }
      dragOffsetX = e.clientX - rect.left; dragOffsetY = e.clientY - rect.top;
      document.body.style.userSelect = 'none';
    };
  }

  document.onmousemove = (e) => {
    if (!isMouseDown) return;
    hasMoved = true;
    const container = document.getElementById(SUMMARY_CONTAINER_ID);
    if (container) {
      container.style.top = `${e.clientY - dragOffsetY}px`;
      container.style.left = `${e.clientX - dragOffsetX}px`;
    }
  };

  document.onmouseup = () => {
    if (isMouseDown) {
      isMouseDown = false;
      document.body.style.userSelect = 'auto';
      const container = document.getElementById(SUMMARY_CONTAINER_ID);
      if (isPinned && container) savePosition(container);
    }
  };

  function savePosition(container) {
    chrome.storage.local.set({ [POSITION_STORAGE_KEY]: { isPinned: true, position: { left: container.style.left, top: container.style.top } } });
  }

})();