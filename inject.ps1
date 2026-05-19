# Script di Iniezione Automatica per Antigravity Auto-Retry
# Esegui questo script in PowerShell per installare l'estensione.

$ErrorActionPreference = "Stop"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   Antigravity Auto-Retry Installer v1.0     " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Rilevamento delle directory
$programsFolder = "$env:LOCALAPPDATA\Programs\Antigravity"
$appFolder = "$programsFolder\resources\app"
$workbenchFolder = "$appFolder\out\vs\code\electron-browser\workbench"

Write-Host "[1/6] Rilevamento percorsi d'installazione..." -ForegroundColor Yellow
if (-not (Test-Path $programsFolder)) {
    Write-Error "Errore: Installazione di Antigravity non trovata nel percorso standard: $programsFolder"
}
Write-Host " -> Trovato Antigravity in: $programsFolder" -ForegroundColor Green

# File da modificare
$filesToInject = @(
    "workbench.html",
    "workbench-jetski-agent.html"
)

# 2. Chiusura sicura di Antigravity (per rimuovere i lock sui file)
Write-Host "[2/6] Chiudo i processi attivi di Antigravity per sbloccare i file..." -ForegroundColor Yellow
$processList = Get-Process -Name "Antigravity" -ErrorAction SilentlyContinue
if ($processList) {
    Write-Host " -> Trovati $($processList.Count) processi attivi. Arresto in corso..." -ForegroundColor Cyan
    $processList | Stop-Process -Force
    Start-Sleep -Seconds 2 # Attendi il rilascio completo dei file
    Write-Host " -> Antigravity chiuso correttamente." -ForegroundColor Green
} else {
    Write-Host " -> Nessun processo attivo trovato." -ForegroundColor Green
}

# 3. Backup ed Iniezione
Write-Host "[3/6] Modifico i file HTML del workbench e creo backup..." -ForegroundColor Yellow

foreach ($fileName in $filesToInject) {
    $filePath = Join-Path $workbenchFolder $fileName
    $backupPath = "$filePath.bak"

    if (-not (Test-Path $filePath)) {
        Write-Host " -> Avviso: File non trovato, salto: $fileName" -ForegroundColor DarkYellow
        continue
    }

    # Creazione del backup se non esiste già
    if (-not (Test-Path $backupPath)) {
        Copy-Item -Path $filePath -Destination $backupPath
        Write-Host " -> Backup creato con successo per: $fileName" -ForegroundColor Green
    } else {
        Write-Host " -> Backup esistente trovato per: $fileName" -ForegroundColor Cyan
    }

    # Lettura ed iniezione
    $htmlContent = Get-Content -Path $filePath -Raw
    if ($htmlContent -notlike "*auto-retry.js*") {
        Write-Host " -> Iniettando tag script in: $fileName" -ForegroundColor Cyan
        
        # Sostituiamo la chiusura di html inserendo il tag script appena prima
        $injectedScript = "<script src=""./auto-retry.js"" type=""module""></script>`r`n</html>"
        $htmlContent = $htmlContent.Replace("</html>", $injectedScript)
        
        Set-Content -Path $filePath -Value $htmlContent -NoNewline
        Write-Host " -> Iniezione completata per: $fileName" -ForegroundColor Green
    } else {
        Write-Host " -> L'iniezione era già presente in: $fileName" -ForegroundColor Green
    }
}

# 4. Copia del file auto-retry.js nella directory dell'IDE
Write-Host "[4/6] Copio il file auto-retry.js nella directory di Antigravity..." -ForegroundColor Yellow
$sourceScript = Join-Path $PSScriptRoot "auto-retry.js"
$destScript = Join-Path $workbenchFolder "auto-retry.js"

if (Test-Path $sourceScript) {
    Copy-Item -Path $sourceScript -Destination $destScript -Force
    Write-Host " -> Copia di auto-retry.js completata con successo." -ForegroundColor Green
} else {
    Write-Error "Errore: Impossibile trovare il file sorgente auto-retry.js in $sourceScript"
}

# 5. Riavvio dell'IDE
Write-Host "[5/6] Riavvio di Antigravity..." -ForegroundColor Yellow
$exePath = Join-Path $programsFolder "Antigravity.exe"
if (Test-Path $exePath) {
    Start-Process -FilePath $exePath
    Write-Host " -> Antigravity riavviato con successo!" -ForegroundColor Green
} else {
    Write-Host " -> Avviso: Impossibile riavviare automaticamente, esegui Antigravity manualmente." -ForegroundColor DarkYellow
}

Write-Host "=============================================" -ForegroundColor Green
Write-Host "     INSTALLAZIONE COMPLETATA CON SUCCESSO   " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "L'auto-retry è ora attivo. Se vedi errori o desideri rimuoverlo," -ForegroundColor White
Write-Host "puoi eseguire lo script 'restore.ps1' in questa stessa cartella." -ForegroundColor White
Write-Host "=============================================" -ForegroundColor Green
