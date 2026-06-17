import os
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, 
    QPushButton, QCheckBox, QComboBox, QMessageBox, QTabWidget,
    QListWidget, QTextEdit
)
from utils.config import config_manager
from utils import autostart

class SettingsWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Configuración IA - Desktop")
        self.resize(450, 500)
        self.setup_ui()

    def setup_ui(self):
        main_layout = QVBoxLayout(self)

        self.tabs = QTabWidget()
        
        # --- Pestaña 1: General (APIs y MCP) ---
        self.tab_general = QWidget()
        self.setup_general_tab()
        self.tabs.addTab(self.tab_general, "General / APIs")
        
        # --- Pestaña 2: Prompts ---
        self.tab_prompts = QWidget()
        self.setup_prompts_tab()
        self.tabs.addTab(self.tab_prompts, "Mis Prompts")

        main_layout.addWidget(self.tabs)

        save_btn = QPushButton("Guardar Todo y Cerrar")
        save_btn.clicked.connect(self.save_all_settings)
        main_layout.addWidget(save_btn)

    def setup_general_tab(self):
        layout = QVBoxLayout(self.tab_general)

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

        layout.addWidget(QLabel("Nvidia API Key:"))
        self.nvidia_key = QLineEdit(config_manager.get("NVIDIA_API_KEY", ""))
        self.nvidia_key.setEchoMode(QLineEdit.EchoMode.Password)
        layout.addWidget(self.nvidia_key)

        if not os.environ.get("FMOODLE_PORTABLE") == "1":
            layout.addWidget(QLabel("--- Sistema ---"))
            self.autostart_chk = QCheckBox("Iniciar automáticamente con Windows")
            self.autostart_chk.setChecked(autostart.is_in_startup())
            layout.addWidget(self.autostart_chk)

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

        layout.addStretch()

    def setup_prompts_tab(self):
        layout = QVBoxLayout(self.tab_prompts)

        self.prompts_data = config_manager.get("CUSTOM_PROMPTS", []).copy()

        # Lista de Prompts
        self.prompt_list = QListWidget()
        self.prompt_list.currentRowChanged.connect(self.on_prompt_selected)
        layout.addWidget(self.prompt_list)
        
        # Botones de lista
        list_btns_layout = QHBoxLayout()
        add_btn = QPushButton("Añadir Nuevo")
        add_btn.clicked.connect(self.add_new_prompt)
        del_btn = QPushButton("Eliminar Seleccionado")
        del_btn.clicked.connect(self.delete_selected_prompt)
        list_btns_layout.addWidget(add_btn)
        list_btns_layout.addWidget(del_btn)
        layout.addLayout(list_btns_layout)

        # Edición del Prompt
        layout.addWidget(QLabel("Título:"))
        self.prompt_title = QLineEdit()
        layout.addWidget(self.prompt_title)
        
        layout.addWidget(QLabel("Contenido del Prompt:"))
        self.prompt_text = QTextEdit()
        layout.addWidget(self.prompt_text)

        update_btn = QPushButton("Actualizar/Guardar Prompt Actual")
        update_btn.clicked.connect(self.update_current_prompt)
        layout.addWidget(update_btn)

        self.refresh_prompt_list()

    def refresh_prompt_list(self):
        self.prompt_list.clear()
        for p in self.prompts_data:
            self.prompt_list.addItem(p["title"])

    def on_prompt_selected(self, index):
        if index >= 0 and index < len(self.prompts_data):
            p = self.prompts_data[index]
            self.prompt_title.setText(p["title"])
            self.prompt_text.setText(p["text"])
        else:
            self.prompt_title.clear()
            self.prompt_text.clear()

    def add_new_prompt(self):
        self.prompts_data.append({"title": "Nuevo Prompt", "text": "..."})
        self.refresh_prompt_list()
        self.prompt_list.setCurrentRow(len(self.prompts_data) - 1)

    def delete_selected_prompt(self):
        row = self.prompt_list.currentRow()
        if row >= 0:
            del self.prompts_data[row]
            self.refresh_prompt_list()
            self.prompt_title.clear()
            self.prompt_text.clear()

    def update_current_prompt(self):
        row = self.prompt_list.currentRow()
        if row >= 0:
            self.prompts_data[row]["title"] = self.prompt_title.text().strip()
            self.prompts_data[row]["text"] = self.prompt_text.toPlainText().strip()
            self.refresh_prompt_list()
            self.prompt_list.setCurrentRow(row)

    def save_all_settings(self):
        # Guardar Generales
        config_manager.set("GEMINI_API_KEY", self.gemini_key.text().strip())
        config_manager.set("GROQ_API_KEY", self.groq_key.text().strip())
        config_manager.set("OPENAI_API_KEY", self.openai_key.text().strip())
        config_manager.set("CLAUDE_API_KEY", self.claude_key.text().strip())
        config_manager.set("NVIDIA_API_KEY", self.nvidia_key.text().strip())
        
        if not os.environ.get("FMOODLE_PORTABLE") == "1":
            autostart.set_startup(self.autostart_chk.isChecked())

        config_manager.set("MCP_ENABLED", self.mcp_enabled.isChecked())
        config_manager.set("MCP_MODE", self.mcp_mode.currentText())
        config_manager.set("MCP_URL", self.mcp_url.text().strip())
        
        # Guardar Prompts
        config_manager.set("CUSTOM_PROMPTS", self.prompts_data)
        
        QMessageBox.information(self, "Guardado", "Configuración guardada correctamente.")
        self.close()
