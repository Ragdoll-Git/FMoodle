import pytest
import os
import sys
import logging

# Configurar logging para guardar en tests/logs (Regla Global 3)
log_dir = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(log_dir, exist_ok=True)
logging.basicConfig(
    filename=os.path.join(log_dir, "test_pipeline.log"),
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Añadir el root dir al path para poder importar
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from core.providers import process_question
from utils.config import config_manager

# Mocks
class MockResponse:
    def __init__(self, json_data, status_code):
        self._json = json_data
        self.status_code = status_code
    def json(self):
        return self._json

def test_gemini_fallback_to_groq(monkeypatch):
    """
    Simula que Gemini da error 503 siempre, forzando la cascada a fallar,
    y activando el Fallback Universal a Groq.
    """
    logging.info("--- INICIANDO TEST: test_gemini_fallback_to_groq ---")
    
    # Configuramos keys falsas para el test
    config_manager.set("GEMINI_API_KEY", "fake_gemini")
    config_manager.set("GROQ_API_KEY", "fake_groq")
    
    # Mockear requests.post
    def mock_post(url, *args, **kwargs):
        logging.debug(f"Peticion interceptada hacia: {url}")
        if "generativelanguage" in url:
            # Simular que los servidores de Google están caídos
            return MockResponse({"error": "Service Unavailable"}, 503)
        elif "groq" in url:
            # Simular que Groq responde exitosamente
            return MockResponse({
                "choices": [{"message": {"content": "Respuesta desde Groq simulado"}}]
            }, 200)
        return MockResponse({}, 404)

    monkeypatch.setattr("requests.post", mock_post)
    
    # Ejecutamos la petición pidiendo a gemini
    logging.info("Solicitando proceso de pregunta a provider='gemini'")
    ans, mod = process_question("Pregunta test", "fakebase64", "gemini", use_mcp=False)
    
    logging.info(f"Resultado final -> {mod}: {ans}")
    
    assert ans == "Respuesta desde Groq simulado"
    assert "Fallback: Llama 4 Scout" in mod
    logging.info("--- TEST COMPLETADO EXITOSAMENTE ---")

def test_mcp_injection(monkeypatch):
    """
    Simula que el MCP está habilitado y responde con contexto extra.
    Luego el request de IA devuelve la pregunta modificada (para testear).
    """
    logging.info("--- INICIANDO TEST: test_mcp_injection ---")
    config_manager.set("MCP_ENABLED", True)
    config_manager.set("MCP_URL", "http://fake-mcp.local")
    config_manager.set("OPENAI_API_KEY", "fake_openai")
    
    def mock_post(url, json=None, *args, **kwargs):
        logging.debug(f"Peticion interceptada: {url}")
        if "fake-mcp" in url:
            return MockResponse({"context": "Datos de Moodle simulados"}, 200)
        elif "openai" in url:
            # Para testear, devolvemos lo mismo que nos enviaron
            sent_text = json["messages"][0]["content"][0]["text"]
            return MockResponse({
                "choices": [{"message": {"content": f"RECIBIDO: {sent_text}"}}]
            }, 200)

    monkeypatch.setattr("requests.post", mock_post)
    
    ans, mod = process_question("¿Qué dice aquí?", "fakebase64", "openai", use_mcp=True)
    logging.info(f"Respuesta IA: {ans}")
    
    assert "Datos de Moodle simulados" in ans
    assert "CONTEXTO ADICIONAL MCP" in ans
    assert mod == "ChatGPT"
    
    # Restaurar
    config_manager.set("MCP_ENABLED", False)
    logging.info("--- TEST COMPLETADO EXITOSAMENTE ---")
