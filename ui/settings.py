from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QLabel, QLineEdit, 
    QPushButton, QCheckBox, QComboBox, QMessageBox
)
from utils.config import config_manager

class SettingsWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Configuración IA - Desktop")
        self.resize(350, 400)
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)

        layout.addWidget(QLabel("Google Gemini API Key:"))
        self.gemini_key = QLineEdit(config_manager.get("GEMINI_API_KEY", ""))
        self.gemini_key.setEchoMode(QLineEdit.EchoMode.Password)
        layout.addWidget(self.gemini_key)

        layout.addWidget(QLabel("Groq API Key:"))
        self.groq_key = QLineEdit(config_manager.get("GROQ_API_KEY", ""))
        self.groq_key.setEchoMode(QLineEdit.EchoMode.Password)
        layout.addWidget(self.groq_key)

        layout.addWidget(QLabel("OpenAI API Key:"))
        self.openai_key = QLineEdit(config_manager.get("OPENAI_API_KEY", ""))
        self.openai_key.setEchoMode(QLineEdit.EchoMode.Password)
        layout.addWidget(self.openai_key)

        layout.addWidget(QLabel("Claude API Key:"))
        self.claude_key = QLineEdit(config_manager.get("CLAUDE_API_KEY", ""))
        self.claude_key.setEchoMode(QLineEdit.EchoMode.Password)
        layout.addWidget(self.claude_key)

        layout.addWidget(QLabel("--- Contexto MCP ---"))
        
        self.mcp_enabled = QCheckBox("Activar MCP")
        self.mcp_enabled.setChecked(config_manager.get("MCP_ENABLED", False))
        layout.addWidget(self.mcp_enabled)

        layout.addWidget(QLabel("Modo MCP:"))
        self.mcp_mode = QComboBox()
        self.mcp_mode.addItems(["local", "online"])
        self.mcp_mode.setCurrentText(config_manager.get("MCP_MODE", "local"))
        layout.addWidget(self.mcp_mode)

        layout.addWidget(QLabel("URL MCP:"))
        self.mcp_url = QLineEdit(config_manager.get("MCP_URL", ""))
        layout.addWidget(self.mcp_url)

        save_btn = QPushButton("Guardar Cambios")
        save_btn.clicked.connect(self.save_settings)
        layout.addWidget(save_btn)
        
        layout.addStretch()

    def save_settings(self):
        config_manager.set("GEMINI_API_KEY", self.gemini_key.text().strip())
        config_manager.set("GROQ_API_KEY", self.groq_key.text().strip())
        config_manager.set("OPENAI_API_KEY", self.openai_key.text().strip())
        config_manager.set("CLAUDE_API_KEY", self.claude_key.text().strip())
        config_manager.set("MCP_ENABLED", self.mcp_enabled.isChecked())
        config_manager.set("MCP_MODE", self.mcp_mode.currentText())
        config_manager.set("MCP_URL", self.mcp_url.text().strip())
        
        QMessageBox.information(self, "Guardado", "Configuración guardada correctamente.")
        self.close()
