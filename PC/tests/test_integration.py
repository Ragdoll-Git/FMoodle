import os
import sys
import logging
from datetime import datetime

# Configurar logs verbosos
log_dir = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, f"test_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt")

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(sys.stdout)
    ]
)

def run_tests():
    logging.info("Iniciando pruebas de integración...")
    
    # Añadir el root dir al path para poder importar módulos
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    
    success = True
    try:
        logging.info("Importando módulo core.providers...")
        import core.providers
        logging.info("Módulo core.providers importado exitosamente.")
    except Exception as e:
        logging.error(f"Error al importar core.providers: {e}")
        success = False

    try:
        logging.info("Importando módulo core.mcp...")
        import core.mcp
        logging.info("Módulo core.mcp importado exitosamente.")
    except Exception as e:
        logging.error(f"Error al importar core.mcp: {e}")
        success = False

    try:
        logging.info("Importando módulo utils.config...")
        import utils.config
        logging.info("Módulo utils.config importado exitosamente.")
    except Exception as e:
        logging.error(f"Error al importar utils.config: {e}")
        success = False
        
    try:
        logging.info("Importando módulo ui.settings...")
        import ui.settings
        logging.info("Módulo ui.settings importado exitosamente.")
    except Exception as e:
        logging.error(f"Error al importar ui.settings: {e}")
        success = False

    if success:
        logging.info("Todos los tests de importación de módulos pasaron exitosamente.")
        sys.exit(0)
    else:
        logging.error("Algunos tests fallaron.")
        sys.exit(1)

if __name__ == '__main__':
    run_tests()