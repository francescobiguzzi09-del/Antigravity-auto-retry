# Script di Rimozione Sicura e Ripristino per Antigravity Auto-Retry
# Esegui questo script in PowerShell per rimuovere l'estensione e ripristinare i file originali.

$ErrorActionPreference = "Stop"

Write-Host "=============================================" -ForegroundColor Red
Write-Host "     Antigravity Auto-Retry Uninstaller      " -ForegroundColor Red
Write-Host "=============================================" -ForegroundColor Red

# 1. Rilevamento delle directory
$programsFolder = "$env:LOCALAPPDATA\Programs\Antigravity"
$appFolder = "$programsFolder\resources\app"
$workbenchFolder = "$appFolder\out\vs\code\electron-browser\workbench"

Write-Host "[1/5] Rilevamento percorsi..." -ForegroundColor Yellow
if (-not (Test-Path $programsFolder)) {
    Write-Error "Errore: Installazione di Antigravity non trovata nel percorso: $programsFolder"
}
Write-Host " -> Trovato Antigravity in: $programsFolder" -ForegroundColor Green

# 2. Chiusura sicura di Antigravity
Write-Host "[2/5] Chiudo i processi attivi di Antigravity..." -ForegroundColor Yellow
$processList = Get-Process -Name "Antigravity" -ErrorAction SilentlyContinue
if ($processList) {
    Write-Host " -> Arresto $($processList.Count) processi in corso..." -ForegroundColor Cyan
    $processList | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host " -> Antigravity chiuso." -ForegroundColor Green
} else {
    Write-Host " -> Nessun processo attivo trovato." -ForegroundColor Green
}

# 3. Ripristino dei file di backup
Write-Host "[3/5] Ripristino i file HTML originali dai backup..." -ForegroundColor Yellow
$filesToRestore = @(
    "workbench.html",
    "workbench-jetski-agent.html"
)

foreach ($fileName in $filesToRestore) {
    $filePath = Join-Path $workbenchFolder $fileName
    $backupPath = "$filePath.bak"

    if (Test-Path $backupPath) {
        # Ripristina il file originale sovrascrivendo quello modificato
        Copy-Item -Path $backupPath -Destination $filePath -Force
        # Rimuove il backup per pulizia
        Remove-Item -Path $backupPath -Force
        Write-Host " -> Ripristinato e rimosso backup per: $fileName" -ForegroundColor Green
    } else {
        Write-Host " -> Nessun backup trovato per: $fileName (salto)" -ForegroundColor DarkYellow
    }
}

# 4. Rimozione di auto-retry.js dalla cartella dell'IDE
Write-Host "[4/5] Rimuovo auto-retry.js dall'installazione..." -ForegroundColor Yellow
$installedScript = Join-Path $workbenchFolder "auto-retry.js"
if (Test-Path $installedScript) {
    Remove-Item -Path $installedScript -Force
    Write-Host " -> Rimosso auto-retry.js correttamente." -ForegroundColor Green
} else {
    Write-Host " -> auto-retry.js non era presente nell'installazione." -ForegroundColor Green
}

# 5. Riavvio dell'IDE
Write-Host "[5/5] Riavvio di Antigravity..." -ForegroundColor Yellow
$exePath = Join-Path $programsFolder "Antigravity.exe"
if (Test-Path $exePath) {
    Start-Process -FilePath $exePath
    Write-Host " -> Antigravity riavviato con successo!" -ForegroundColor Green
} else {
    Write-Host " -> Avviso: Esegui Antigravity manualmente." -ForegroundColor DarkYellow
}

Write-Host "=============================================" -ForegroundColor Green
Write-Host "    RIMOZIONE E RIPRISTINO COMPLETATI        " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "L'IDE è tornato al suo stato originale pulito." -ForegroundColor White
Write-Host "=============================================" -ForegroundColor Green
