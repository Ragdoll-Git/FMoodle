def get_stylesheet(theme: str) -> str:
    """
    Retorna el QSS (Qt Style Sheets) para el tema correspondiente,
    aplicando un efecto similar a Glassmorphism.
    """
    if theme == "light":
        return """
            QWidget#MainWidget {
                background-color: rgba(255, 255, 255, 220);
                border-radius: 12px;
                border: 1px solid rgba(200, 200, 200, 150);
            }
            QLabel {
                color: #1f2937;
                font-family: 'Segoe UI', Tahoma, sans-serif;
            }
            QTextEdit {
                background-color: rgba(255, 255, 255, 180);
                border: 1px solid #d1d5db;
                border-radius: 6px;
                padding: 8px;
                color: #1f2937;
                font-family: 'Segoe UI', Tahoma, sans-serif;
            }
            QTextEdit:focus {
                border: 2px solid #3b82f6;
            }
            QPushButton {
                background-color: #3b82f6;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #2563eb;
            }
            QComboBox {
                background-color: rgba(255, 255, 255, 200);
                border: 1px solid #d1d5db;
                border-radius: 4px;
                padding: 4px;
                color: #1f2937;
            }
            QCheckBox {
                color: #1f2937;
                font-weight: bold;
            }
        """
    else:
        return """
            QWidget#MainWidget {
                background-color: rgba(30, 30, 30, 220);
                border-radius: 12px;
                border: 1px solid rgba(80, 80, 80, 150);
            }
            QLabel {
                color: #e5e7eb;
                font-family: 'Segoe UI', Tahoma, sans-serif;
            }
            QTextEdit {
                background-color: rgba(40, 40, 40, 180);
                border: 1px solid #4b5563;
                border-radius: 6px;
                padding: 8px;
                color: #f9fafb;
                font-family: 'Segoe UI', Tahoma, sans-serif;
            }
            QTextEdit:focus {
                border: 2px solid #60a5fa;
            }
            QPushButton {
                background-color: #3b82f6;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #2563eb;
            }
            QComboBox {
                background-color: rgba(40, 40, 40, 200);
                border: 1px solid #4b5563;
                border-radius: 4px;
                padding: 4px;
                color: #f9fafb;
            }
            QCheckBox {
                color: #e5e7eb;
                font-weight: bold;
            }
        """
