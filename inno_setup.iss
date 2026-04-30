[Setup]
AppName=FMoodle
AppVersion=1.0
DefaultDirName={pf}\FMoodle
DefaultGroupName=FMoodle
OutputBaseFilename=FMoodle_Installer
Compression=lzma
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64

[Tasks]
Name: "desktopicon"; Description: "Crear un icono en el escritorio"; GroupDescription: "Iconos adicionales:"

[Files]
Source: "dist\FMoodle\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\FMoodle"; Filename: "{app}\FMoodle.exe"
Name: "{commondesktop}\FMoodle"; Filename: "{app}\FMoodle.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\FMoodle.exe"; Description: "Ejecutar FMoodle"; Flags: nowait postinstall skipifsilent
