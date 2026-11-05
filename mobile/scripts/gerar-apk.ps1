# Gera o APK apontando para a API informada e copia para a landing.
# Uso: .\mobile\scripts\gerar-apk.ps1 -ApiUrl https://gosafe-api.onrender.com
# -Emulador inclui x86_64, para instalar também no emulador Android.
param(
  [Parameter(Mandatory)][string]$ApiUrl,
  [switch]$Emulador
)
$ErrorActionPreference = 'Stop'

$repo = (Resolve-Path "$PSScriptRoot\..\..").Path
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:EXPO_PUBLIC_API_URL = $ApiUrl
$env:CI = '1'
$abis = if ($Emulador) { 'arm64-v8a,x86_64' } else { 'arm64-v8a' }

# o caminho do repositório é longo demais para as ferramentas nativas do Android
subst W: "$repo"
try {
  Remove-Item 'W:\mobile\android\app\.cxx' -Recurse -Force -ErrorAction SilentlyContinue
  # o Gradle não vê a troca de EXPO_PUBLIC_API_URL e reaproveitaria o bundle com o endereço antigo
  Remove-Item 'W:\mobile\android\app\build\generated\assets\react' -Recurse -Force -ErrorAction SilentlyContinue
  Remove-Item "$env:TEMP\metro-cache" -Recurse -Force -ErrorAction SilentlyContinue
  Push-Location 'W:\mobile\android'
  .\gradlew.bat assembleRelease "-PreactNativeArchitectures=$abis" --console=plain
  if ($LASTEXITCODE -ne 0) { throw "gradle terminou com código $LASTEXITCODE" }
  .\gradlew.bat --stop | Out-Null
  Pop-Location
} finally {
  subst W: /D
}

New-Item -ItemType Directory -Force "$repo\landing\downloads" | Out-Null
Copy-Item "$repo\mobile\android\app\build\outputs\apk\release\app-release.apk" "$repo\landing\downloads\GoSafe.apk" -Force
Get-Item "$repo\landing\downloads\GoSafe.apk" | Select-Object Length, LastWriteTime
