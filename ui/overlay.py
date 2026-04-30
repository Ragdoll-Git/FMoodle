from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTextEdit, 
    QPushButton, QComboBox, QCheckBox, QLabel, QScrollArea, QApplication
)
from PySide6.QtCore import Qt, QThread, Signal, QTimer
from PySide6.QtGui import QKeyEvent

from utils.config import config_manager
from utils.capture import get_screen_theme_hint
from ui.theme import get_stylesheet
from core.providers import process_question

class WorkerThread(QThread):
    finished = Signal(str, str) # result, model
    error = Signal(str)

    def __init__(self, question, base64_image, provider, use_mcp):
        super().__init__()
        self.question = question
        self.base64_image = base64_image
        self.provider = provider
        self.use_mcp = use_mcp

    def run(self):
        try:
            ans, mod = process_question(self.question, self.base64_image, self.provider, self.use_mcp)
            self.finished.emit(ans, mod)
        except Exception as e:
            self.error.emit(str(e))

class OverlayWindow(QWidget):
    def __init__(self):
        super().__init__()
        # Frameless, Always on Top, Tool (no taskbar icon)
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.WindowStaysOnTopHint | Qt.WindowType.Tool)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        
        self.base64_image = None
        self.setup_ui()
        self.apply_theme()

    def setup_ui(self):
        self.setObjectName("MainWidget")
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(15, 15, 15, 15)
        layout.setSpacing(10)

        # Header controls
        header_layout = QHBoxLayout()
        
        self.prompt_select = QComboBox()
        self.prompt_select.addItem("Prompt...", "")
        prompts = config_manager.get("CUSTOM_PROMPTS", [])
        for p in prompts:
            self.prompt_select.addItem(p["title"], p["text"])
        self.prompt_select.currentIndexChanged.connect(self.on_prompt_selected)
        
        self.provider_select = QComboBox()
        self.provider_select.addItems(["gemini", "groq", "openai", "claude", "nvidia"])
        self.provider_select.setCurrentText(config_manager.get("preferredProvider", "gemini"))
        self.provider_select.currentTextChanged.connect(
            lambda t: config_manager.set("preferredProvider", t)
        )
        
        self.mcp_checkbox = QCheckBox("MCP")
        self.mcp_checkbox.setChecked(config_manager.get("MCP_ENABLED", False))

        self.minimize_btn = QPushButton("—")
        self.minimize_btn.setObjectName("WindowControlBtn")
        self.minimize_btn.setFixedSize(28, 28)
        self.minimize_btn.clicked.connect(self.hide)

        self.close_btn = QPushButton("✕")
        self.close_btn.setObjectName("WindowControlBtn")
        self.close_btn.setFixedSize(28, 28)
        self.close_btn.clicked.connect(self.hide)

        header_layout.addWidget(self.prompt_select)
        header_layout.addWidget(self.provider_select)
        header_layout.addWidget(self.mcp_checkbox)
        header_layout.addStretch()
        header_layout.addWidget(self.minimize_btn)
        header_layout.addWidget(self.close_btn)

        # Input Area
        input_layout = QHBoxLayout()
        self.input_box = QTextEdit()
        self.input_box.setPlaceholderText("Escribe tu pregunta... (Shift+Enter para nueva línea, Enter para enviar)")
        self.input_box.setFixedHeight(60)
        self.input_box.installEventFilter(self) # To catch Enter
        
        self.send_btn = QPushButton("➤")
        self.send_btn.setFixedSize(40, 40)
        self.send_btn.clicked.connect(self.send_question)
        
        input_layout.addWidget(self.input_box)
        input_layout.addWidget(self.send_btn)

        # Output Area (Scrollable)
        self.scroll_area = QScrollArea()
        self.scroll_area.setWidgetResizable(True)
        self.scroll_area.setFrameShape(QScrollArea.Shape.NoFrame)
        self.scroll_area.setStyleSheet("background-color: transparent;")
        
        self.output_label = QLabel("Esperando pregunta...")
        self.output_label.setWordWrap(True)
        self.output_label.setTextInteractionFlags(Qt.TextInteractionFlag.TextSelectableByMouse)
        self.scroll_area.setWidget(self.output_label)
        self.scroll_area.hide()

        layout.addLayout(header_layout)
        layout.addLayout(input_layout)
        layout.addWidget(self.scroll_area)

        self.resize(400, 150)

    def eventFilter(self, obj, event):
        if obj is self.input_box and event.type() == QKeyEvent.Type.KeyPress:
            if event.key() == Qt.Key.Key_Return or event.key() == Qt.Key.Key_Enter:
                if event.modifiers() & Qt.KeyboardModifier.ShiftModifier:
                    return False # Allow newline
                else:
                    self.send_question()
                    return True # Consume event
        return super().eventFilter(obj, event)

    def keyPressEvent(self, event: QKeyEvent):
        if event.key() == Qt.Key.Key_Escape:
            self.hide()
        else:
            super().keyPressEvent(event)

    def apply_theme(self):
        theme_hint = get_screen_theme_hint()
        self.setStyleSheet(get_stylesheet(theme_hint))

    def on_prompt_selected(self, index):
        text = self.prompt_select.itemData(index)
        if text:
            self.input_box.setText(text)
            self.input_box.setFocus()

    def send_question(self):
        q = self.input_box.toPlainText().strip()
        if not q: return
        
        if not self.base64_image:
            self.show_message("Error: No hay captura de pantalla en memoria.", is_error=True)
            return

        provider = self.provider_select.currentText()
        use_mcp = self.mcp_checkbox.isChecked()

        self.show_message(f"Analizando con {provider}...", is_loading=True)
        self.send_btn.setEnabled(False)
        self.input_box.setEnabled(False)

        self.worker = WorkerThread(q, self.base64_image, provider, use_mcp)
        self.worker.finished.connect(self.on_result)
        self.worker.error.connect(self.on_error)
        self.worker.start()

    def on_result(self, ans, mod):
        self.send_btn.setEnabled(True)
        self.input_box.setEnabled(True)
        self.show_message(f"[{mod}]\n\n{ans}")
        self.input_box.clear()

    def on_error(self, err_msg):
        self.send_btn.setEnabled(True)
        self.input_box.setEnabled(True)
        self.show_message(f"Error: {err_msg}", is_error=True)

    def set_input_visible(self, visible):
        self.prompt_select.setVisible(visible)
        self.provider_select.setVisible(visible)
        self.mcp_checkbox.setVisible(visible)
        self.input_box.setVisible(visible)
        self.send_btn.setVisible(visible)

    def show_message(self, text, is_loading=False, is_error=False):
        self.scroll_area.show()
        if is_error:
            self.output_label.setStyleSheet("color: #ef4444; font-weight: bold;")
        elif is_loading:
            self.output_label.setStyleSheet("color: #3b82f6; font-style: italic;")
        else:
            self.output_label.setStyleSheet("")
        
        self.output_label.setText(text)
        
        # Ocultar los inputs para dejar solo la respuesta
        self.set_input_visible(False)
        
        # Ajustar tamaño
        self.resize(400, 350)
        
        # Reposicionar usando availableGeometry para evitar la barra de tareas
        screen = QApplication.primaryScreen().availableGeometry()
        x = (screen.width() - self.width()) // 2
        y = screen.height() - self.height() - 20
        self.move(x, y)
        
    def refresh_prompts(self):
        # Guardar el índice actual si es posible, o limpiar
        self.prompt_select.blockSignals(True)
        self.prompt_select.clear()
        self.prompt_select.addItem("Prompt...", "")
        prompts = config_manager.get("CUSTOM_PROMPTS", [])
        for p in prompts:
            self.prompt_select.addItem(p["title"], p["text"])
        self.prompt_select.blockSignals(False)

    def show_for_capture(self, b64_img):
        self.refresh_prompts()
        self.base64_image = b64_img
        self.apply_theme()
        
        self.scroll_area.hide()
        self.set_input_visible(True)
        self.resize(400, 150)
        self.input_box.clear()
        
        # Reposicionar usando availableGeometry
        screen = QApplication.primaryScreen().availableGeometry()
        x = (screen.width() - self.width()) // 2
        y = screen.height() - self.height() - 20
        self.move(x, y)
        
        self.show()
        self.activateWindow()
        self.input_box.setFocus()
