"""Tests del router de proveedores: detección de modelo y fallback multimodal."""
import pytest

from core import providers


@pytest.fixture(autouse=True)
def _clear_model_cache():
    providers._model_cache.clear()
    yield
    providers._model_cache.clear()


class _Resp:
    def __init__(self, payload, status=200):
        self._payload = payload
        self.status_code = status

    def raise_for_status(self):
        if self.status_code >= 400:
            raise Exception(f"HTTP {self.status_code}")

    def json(self):
        return self._payload


# ----------------------------- Detección de modelo -----------------------------

def test_detect_gemini_prefiere_flash_mas_nuevo(monkeypatch):
    payload = {"models": [
        {"name": "models/gemini-2.5-flash", "supportedGenerationMethods": ["generateContent"]},
        {"name": "models/gemini-3.5-flash", "supportedGenerationMethods": ["generateContent"]},
        {"name": "models/gemini-2.5-pro", "supportedGenerationMethods": ["generateContent"]},
        {"name": "models/embedding-001", "supportedGenerationMethods": ["embedContent"]},
        {"name": "models/imagen-3.0", "supportedGenerationMethods": ["generateContent"]},
    ]}
    monkeypatch.setattr(providers.requests, "get", lambda *a, **k: _Resp(payload))

    info = providers._detect_gemini_model("KEY")
    assert info["model"] == "gemini-3.5-flash"
    assert info["multimodal"] is True


def test_detect_gemini_sin_candidatos_falla(monkeypatch):
    payload = {"models": [
        {"name": "models/embedding-001", "supportedGenerationMethods": ["embedContent"]},
    ]}
    monkeypatch.setattr(providers.requests, "get", lambda *a, **k: _Resp(payload))
    with pytest.raises(Exception):
        providers._detect_gemini_model("KEY")


def test_detect_nvidia_prefiere_vision(monkeypatch):
    payload = {"data": [
        {"id": "meta/llama-3.1-70b-instruct"},
        {"id": "meta/llama-3.2-90b-vision-instruct"},
    ]}
    monkeypatch.setattr(providers.requests, "get", lambda *a, **k: _Resp(payload))

    info = providers._detect_nvidia_model("KEY")
    assert "vision" in info["model"]
    assert info["multimodal"] is True


def test_detect_nvidia_sin_vision_es_solo_texto(monkeypatch):
    payload = {"data": [{"id": "meta/llama-3.1-70b-instruct"}]}
    monkeypatch.setattr(providers.requests, "get", lambda *a, **k: _Resp(payload))

    info = providers._detect_nvidia_model("KEY")
    assert info["multimodal"] is False


# ----------------------------- Fallback multimodal -----------------------------

def test_call_provider_saltea_modelo_no_multimodal(monkeypatch):
    monkeypatch.setattr(providers.config_manager, "get",
                        lambda k, d=None: "KEY" if k.endswith("_API_KEY") else d)
    monkeypatch.setattr(providers, "_resolve_model",
                        lambda prov, key: {"model": "solo-texto", "name": "N", "multimodal": False})
    # Con imagen requerida, un modelo solo-texto debe lanzar (para saltearse).
    with pytest.raises(Exception):
        providers._call_provider("nvidia", "q", "BASE64", needs_image=True)


def test_fallback_sticky_fija_proveedor(monkeypatch):
    monkeypatch.setattr(providers, "inject_context_if_needed", lambda q, m: q)

    def fake_call(prov, question, image, needs_image):
        if prov == "gemini":
            raise Exception("gemini caído")
        if prov == "groq":
            return "respuesta", "Groq (Llama 4 Scout)"
        raise Exception("nvidia tampoco")

    monkeypatch.setattr(providers, "_call_provider", fake_call)

    text, label = providers.process_question("q", "BASE64", "gemini", False)
    assert text == "respuesta"
    assert label.startswith("Fallback")
    # Se queda fijado en el proveedor que funcionó.
    assert providers.config_manager.get("preferredProvider") == "groq"


def test_preferido_ok_no_marca_fallback(monkeypatch):
    monkeypatch.setattr(providers, "inject_context_if_needed", lambda q, m: q)

    def fake_call(prov, question, image, needs_image):
        if prov == "gemini":
            return "ok", "Gemini (gemini-3.5-flash)"
        raise Exception("no debería llegar")

    monkeypatch.setattr(providers, "_call_provider", fake_call)

    text, label = providers.process_question("q", "BASE64", "gemini", False)
    assert text == "ok"
    assert not label.startswith("Fallback")


def test_todos_los_proveedores_fallan(monkeypatch):
    monkeypatch.setattr(providers, "inject_context_if_needed", lambda q, m: q)

    def fake_call(prov, question, image, needs_image):
        raise Exception(f"{prov} boom")

    monkeypatch.setattr(providers, "_call_provider", fake_call)

    with pytest.raises(Exception):
        providers.process_question("q", "BASE64", "gemini", False)
