import mss
import base64
from PIL import Image
import io

def capture_screen_base64() -> str:
    """
    Captura la pantalla principal de forma ultra rápida usando mss
    y devuelve la imagen codificada en base64 (PNG).
    """
    with mss.mss() as sct:
        # monitor 1 es el principal
        monitor = sct.monitors[1]
        sct_img = sct.grab(monitor)
        
        # Convertir a PIL Image
        img = Image.frombytes("RGB", sct_img.size, sct_img.bgra, "raw", "BGRX")
        
        # Guardar en bytes
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        
        return base64.b64encode(buffer.getvalue()).decode('utf-8')

def get_screen_theme_hint() -> str:
    """
    Analiza la parte inferior de la pantalla para determinar si el tema predominante es claro u oscuro.
    Devuelve 'light' o 'dark'.
    """
    with mss.mss() as sct:
        monitor = sct.monitors[1]
        
        # Capturamos solo la franja inferior (último 20% de la pantalla)
        bottom_rect = {
            "top": monitor["top"] + int(monitor["height"] * 0.8),
            "left": monitor["left"],
            "width": monitor["width"],
            "height": int(monitor["height"] * 0.2)
        }
        
        sct_img = sct.grab(bottom_rect)
        img = Image.frombytes("RGB", sct_img.size, sct_img.bgra, "raw", "BGRX")
        
        # Redimensionar a algo minúsculo para obtener el promedio rápido
        img = img.resize((1, 1))
        r, g, b = img.getpixel((0, 0))
        
        # Calcular luminancia (fórmula estándar)
        luminance = (0.299 * r + 0.587 * g + 0.114 * b)
        
        if luminance > 127.5:
            return "light"
        else:
            return "dark"
