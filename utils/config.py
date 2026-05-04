import os
import json
import keyring

CONFIG_FILE = "config.json"
PROMPTS_FILE = "prompts.json"
SERVICE_NAME = "FMoodle"

DEFAULT_CONFIG = {
    "MCP_ENABLED": False,
    "MCP_MODE": "local",
    "MCP_URL": "",
    "preferredProvider": "gemini"
}

DEFAULT_PROMPTS = [
    {
        "title": "Tratamiento de Señal",
        "text": "Sos un experto en transformadas de fourier, señales electricas (analogicas y digitales), matematica aplicada. Necesito que resuelvas profundizando y razonando bien los ejercicios siguientes, pero respondiendo de forma concisa, corta y clara, despues si queres dar una breve explicacion, hazlo debajo de la respuesta corta. El ejercicio es:"
    },
    {
        "title": "Programacion C/C++",
        "text": "Podes desarrollar el codigo en C, únicamente incluyendo en el codigo: 1. La libreria iostream (salvo caso indispensable de usar otra/s). 2. Variables lejibles y humanas. 3. cout, cin (using namespace std), int, float (no setear precision), no usar funciones (salvo si es indispensablemente necesario). 4. Sin comentarios, ni tampoco descripciones largas. El ejercicio es:"
    }
]

class ConfigManager:
    def __init__(self, config_path=CONFIG_FILE, prompts_path=PROMPTS_FILE):
        self.is_portable = os.environ.get("FMOODLE_PORTABLE") == "1"
        
        if not self.is_portable:
            appdata_dir = os.environ.get("APPDATA", "")
            if appdata_dir:
                base_dir = os.path.join(appdata_dir, SERVICE_NAME)
                os.makedirs(base_dir, exist_ok=True)
                self.config_path = os.path.join(base_dir, config_path)
                self.prompts_path = os.path.join(base_dir, prompts_path)
            else:
                self.config_path = config_path
                self.prompts_path = prompts_path
        else:
            self.config_path = config_path
            self.prompts_path = prompts_path

        self.portable_secrets = {}
        self.config = self.load()
        self.prompts = self.load_prompts()
        if not self.is_portable:
            self._migrate_old_keys()

    def _migrate_old_keys(self):
        # Si había claves en el viejo config.json, las pasamos a keyring y las borramos del json
        migrated = False
        for key in ["GEMINI_API_KEY", "GROQ_API_KEY", "OPENAI_API_KEY", "CLAUDE_API_KEY", "NVIDIA_API_KEY"]:
            if key in self.config:
                val = self.config[key]
                if val:
                    keyring.set_password(SERVICE_NAME, key, val)
                del self.config[key]
                migrated = True
                
        if "CUSTOM_PROMPTS" in self.config:
            self.prompts = self.config["CUSTOM_PROMPTS"]
            self.save_prompts(self.prompts)
            del self.config["CUSTOM_PROMPTS"]
            migrated = True
            
        if migrated:
            self.save_config()

    def load(self):
        if not os.path.exists(self.config_path):
            self.save(DEFAULT_CONFIG)
            return DEFAULT_CONFIG.copy()
        
        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                merged = DEFAULT_CONFIG.copy()
                merged.update(data)
                return merged
        except Exception:
            return DEFAULT_CONFIG.copy()

    def load_prompts(self):
        if not os.path.exists(self.prompts_path):
            self.save_prompts(DEFAULT_PROMPTS)
            return DEFAULT_PROMPTS.copy()
        try:
            with open(self.prompts_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return DEFAULT_PROMPTS.copy()

    def save(self, data=None):
        if data is not None:
            self.config = data
        self.save_config()

    def save_config(self):
        if self.is_portable:
            return
        with open(self.config_path, "w", encoding="utf-8") as f:
            json.dump(self.config, f, indent=4, ensure_ascii=False)

    def save_prompts(self, prompts):
        self.prompts = prompts
        if self.is_portable:
            return
        with open(self.prompts_path, "w", encoding="utf-8") as f:
            json.dump(self.prompts, f, indent=4, ensure_ascii=False)

    def get(self, key, default=None):
        if key.endswith("_API_KEY"):
            if self.is_portable:
                return self.portable_secrets.get(key, default)
            val = keyring.get_password(SERVICE_NAME, key)
            return val if val is not None else default
        elif key == "CUSTOM_PROMPTS":
            return self.prompts
        return self.config.get(key, default)

    def set(self, key, value):
        if key.endswith("_API_KEY"):
            if self.is_portable:
                self.portable_secrets[key] = value
                return
            if value:
                keyring.set_password(SERVICE_NAME, key, value)
            else:
                try:
                    keyring.delete_password(SERVICE_NAME, key)
                except keyring.errors.PasswordDeleteError:
                    pass
        elif key == "CUSTOM_PROMPTS":
            self.save_prompts(value)
        else:
            self.config[key] = value
            self.save_config()

config_manager = ConfigManager()
