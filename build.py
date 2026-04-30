import os
import shutil
import subprocess
import sys

def build():
    print("Limpiando builds anteriores...")
    if os.path.exists("dist"):
        shutil.rmtree("dist")
    if os.path.exists("build"):
        shutil.rmtree("build")

    # Forzamos la ruta al PyInstaller dentro del entorno virtual
    pyinstaller_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".venv", "Scripts", "pyinstaller.exe")

    print("Compilando versión Persistente (FMoodle.exe)...")
    subprocess.run([
        pyinstaller_path,
        "--noconfirm",
        "--onedir",
        "--windowed",
        "--name", "FMoodle",
        "main.py"
    ], check=True)

    print("Compilando versión Portable (FMoodle_Portable.exe)...")
    subprocess.run([
        pyinstaller_path,
        "--noconfirm",
        "--onefile",
        "--windowed",
        "--name", "FMoodle_Portable",
        "portable.py"
    ], check=True)

    print("¡Build finalizado con éxito!")
    print("Revisa la carpeta 'dist/'")

if __name__ == "__main__":
    build()
