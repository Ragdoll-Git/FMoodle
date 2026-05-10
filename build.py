import os
import shutil
import subprocess
import sys

def build():
    # Cambiar al directorio donde está el script para que no falle si se llama desde otra ruta
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    print("Limpiando builds anteriores...")
    if os.path.exists("dist"):
        shutil.rmtree("dist")
    if os.path.exists("build"):
        shutil.rmtree("build")

    # Forzamos la ruta al PyInstaller dentro del entorno virtual
    pyinstaller_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".venv", "Scripts", "pyinstaller.exe")

    # Argumentos comunes: datos empaquetados y módulos ocultos
    common_args = [
        "--add-data", "images;images",
        "--hidden-import", "pynput.keyboard._win32",
        "--hidden-import", "pynput.mouse._win32",
        "--hidden-import", "keyring.backends",
        "--hidden-import", "keyring.backends.Windows",
    ]

    print("Compilando versión Persistente (FMoodle.exe)...")
    subprocess.run([
        pyinstaller_path,
        "--noconfirm",
        "--onedir",
        "--windowed",
        "--name", "FMoodle",
        *common_args,
        "main.py"
    ], check=True)

    print("Compilando versión Portable (FMoodle_Portable.exe)...")
    subprocess.run([
        pyinstaller_path,
        "--noconfirm",
        "--onefile",
        "--windowed",
        "--name", "FMoodle_Portable",
        *common_args,
        "portable.py"
    ], check=True)

    print("¡Build finalizado con éxito!")
    print("Revisa la carpeta 'dist/'")

if __name__ == "__main__":
    build()
