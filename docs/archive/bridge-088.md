$ErrorActionPreference = "Stop"

Write-Host "=== GIT STATUS AUDIT ===" -ForegroundColor Cyan
Write-Host ""

# Frontend repo
$frontend = "C:/Users/ELON/Projects-2026/IDEA STORE/elimux-frontend"
if (Test-Path $frontend) {
    Set-Location $frontend
    Write-Host "--- FRONTEND (elimux-frontend) ---" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    
    $untracked = git ls-files --others --exclude-standard
    if ($untracked) {
        Write-Host "UNTRACKED FILES:" -ForegroundColor Red
        $untracked | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    }
    
    $modified = git diff --name-only
    if ($modified) {
        Write-Host "MODIFIED FILES:" -ForegroundColor Red
        $modified | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    }
    
    $staged = git diff --cached --name-only
    if ($staged) {
        Write-Host "STAGED FILES:" -ForegroundColor Green
        $staged | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    }
    
    if (!$untracked -and !$modified -and !$staged) {
        Write-Host "Working tree clean." -ForegroundColor Green
    }
    Write-Host ""
}

# SQL repo
$sql = "C:/Users/ELON/Projects-2026/IDEA STORE/elimium-sql"
if (Test-Path $sql) {
    Set-Location $sql
    Write-Host "--- SQL REPO (elimux-sql) ---" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    
    $untracked = git ls-files --others --exclude-standard
    if ($untracked) {
        Write-Host "UNTRACKED FILES:" -ForegroundColor Red
        $untracked | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    }
    
    $modified = git diff --name-only
    if ($modified) {
        Write-Host "MODIFIED FILES:" -ForegroundColor Red
        $modified | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    }
    
    $staged = git diff --cached --name-only
    if ($staged) {
        Write-Host "STAGED FILES:" -ForegroundColor Green
        $staged | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    }
    
    if (!$untracked -and !$modified -and !$staged) {
        Write-Host "Working tree clean." -ForegroundColor Green
    }
    Write-Host ""
}

Write-Host "=== END AUDIT ===" -ForegroundColor Cyan
