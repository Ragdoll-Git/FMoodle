import os
import json

CONFIG_FILE = "config.json"

DEFAULT_CONFIG = {
    "GEMINI_API_KEY": "",
    "GROQ_API_KEY": "",
    "OPENAI_API_KEY": "",
    "CLAUDE_API_KEY": "",
    "MCP_ENABLED": False,
    "MCP_MODE": "local",
    "MCP_URL": "",
    "preferredProvider": "gemini",
    "CUSTOM_PROMPTS": [
        {
            "title": "Tratamiento de Señal",
            "text": "Sos un experto en transformadas de fourier, señales electricas (analogicas y digitales), matematica aplicada. Necesito que resuelvas profundizando y razonando bien los ejercicios siguientes, pero respondiendo de forma concisa, corta y clara, despues si queres dar una breve explicacion, hazlo debajo de la respuesta corta. El ejercicio es:"
        },
        {
            "title": "Programacion C/C++",
            "text": "Podes desarrollar el codigo en C, únicamente incluyendo en el codigo: 1. La libreria iostream (salvo caso indispensable de usar otra/s). 2. Variables lejibles y humanas. 3. cout, cin (using namespace std), int, float (no setear precision), no usar funciones (salvo si es indispensablemente necesario). 4. Sin comentarios, ni tampoco descripciones largas. El ejercicio es:"
        }
    ]
}

class ConfigManager:
    def __init__(self, config_path=CONFIG_FILE):
        self.config_path = config_path
        self.config = self.load()

    def load(self):
        if not os.path.exists(self.config_path):
            self.save(DEFAULT_CONFIG)
            return DEFAULT_CONFIG.copy()
        
        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                # Merge con defaults por si faltan keys
                merged = DEFAULT_CONFIG.copy()
                merged.update(data)
                return merged
        except Exception as e:
            print(f"Error loading config: {e}")
            return DEFAULT_CONFIG.copy()

    def save(self, data=None):
        if data is not None:
            self.config = data
        try:
            with open(self.config_path, "w", encoding="utf-8") as f:
                json.dump(self.config, f, indent=4)
        except Exception as e:
            print(f"Error saving config: {e}")

    def get(self, key, default=None):
        return self.config.get(key, default)

    def set(self, key, value):
        self.config[key] = value
        self.save()

config_manager = ConfigManager()
