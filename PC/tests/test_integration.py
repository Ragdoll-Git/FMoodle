"""Smoke tests de integración: verifican que los módulos principales de la
aplicación de escritorio se importan sin errores (dependencias resueltas,
sintaxis válida y rutas de paquetes correctas tras la reorganización)."""
import importlib

import pytest

CORE_MODULES = [
    "core.providers",
    "core.mcp",
    "utils.config",
    "ui.settings",
]


@pytest.mark.parametrize("module_name", CORE_MODULES)
def test_module_imports(module_name):
    module = importlib.import_module(module_name)
    assert module is not None
