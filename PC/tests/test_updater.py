"""Tests del sistema de actualización (sin acceso real a la red)."""
import pytest

from core import updater


class _FakeResp:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        pass

    def json(self):
        return self._payload


def _release(tag, assets):
    return {
        "tag_name": tag,
        "html_url": f"https://github.com/Ragdoll-Git/FMoodle/releases/tag/{tag}",
        "assets": [
            {"name": n, "browser_download_url": f"https://x/{tag}/{n}"}
            for n in assets
        ],
    }


@pytest.mark.parametrize("text,expected", [
    ("FMoodle-v3.6.3", (3, 6, 3)),
    ("v3.6", (3, 6, 0)),
    ("3.7.1", (3, 7, 1)),
    ("sin-numero", (0, 0, 0)),
])
def test_parse_version(text, expected):
    assert updater.parse_version(text) == expected


def test_check_detecta_nueva_version(monkeypatch):
    monkeypatch.delenv("FMOODLE_PORTABLE", raising=False)  # modo instalado
    payload = _release("FMoodle-v3.6.3",
                       ["FMoodle_Installer.exe", "FMoodle_Portable.exe"])
    monkeypatch.setattr(updater.requests, "get", lambda *a, **k: _FakeResp(payload))

    info = updater.check_for_update(current="3.6.2")
    assert info["available"] is True
    assert info["asset"] == "FMoodle_Installer.exe"
    assert info["download_url"].endswith("FMoodle_Installer.exe")


def test_check_al_dia(monkeypatch):
    monkeypatch.delenv("FMOODLE_PORTABLE", raising=False)
    payload = _release("FMoodle-v3.6.2", ["FMoodle_Installer.exe"])
    monkeypatch.setattr(updater.requests, "get", lambda *a, **k: _FakeResp(payload))

    info = updater.check_for_update(current="3.6.2")
    assert info["available"] is False


def test_check_selecciona_asset_portable(monkeypatch):
    monkeypatch.setenv("FMOODLE_PORTABLE", "1")  # modo portable
    payload = _release("FMoodle-v3.6.3",
                       ["FMoodle_Installer.exe", "FMoodle_Portable.exe"])
    monkeypatch.setattr(updater.requests, "get", lambda *a, **k: _FakeResp(payload))

    info = updater.check_for_update(current="3.6.2")
    assert info["asset"] == "FMoodle_Portable.exe"
    assert info["download_url"].endswith("FMoodle_Portable.exe")


def test_check_asset_faltante_lanza_error(monkeypatch):
    monkeypatch.delenv("FMOODLE_PORTABLE", raising=False)
    payload = _release("FMoodle-v3.6.3", ["FMoodle_Extension.zip"])  # sin installer
    monkeypatch.setattr(updater.requests, "get", lambda *a, **k: _FakeResp(payload))

    with pytest.raises(ValueError):
        updater.check_for_update(current="3.6.2")


def test_apply_update_bloqueado_en_desarrollo(monkeypatch):
    # En modo no compilado (python crudo) NO debe intentar reemplazar nada.
    monkeypatch.setattr(updater, "is_frozen", lambda: False)
    with pytest.raises(RuntimeError):
        updater.apply_update("cualquier_cosa.exe")
