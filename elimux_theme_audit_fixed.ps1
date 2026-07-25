
# ============================================================
# ElimuX THEME AUDIT SCRIPT (FIXED)
# Run this inside: C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend
# ============================================================

$frontendPath = "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
Set-Location $frontendPath

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ELIMUX THEME SYSTEM AUDIT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Check if next-themes is installed
Write-Host "--- 1. DEPENDENCIES ---" -ForegroundColor Yellow
$pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
$hasNextThemes = $pkg.dependencies.'next-themes' -or $pkg.devDependencies.'next-themes'
Write-Host "next-themes in package.json: $(if($hasNextThemes){'YES'}else{'MISSING'})" -ForegroundColor $(if($hasNextThemes){'Green'}else{'Red'})

# 2. Check tailwind config for darkMode
Write-Host "`n--- 2. TAILWIND CONFIG ---" -ForegroundColor Yellow
$tailwindFiles = @("tailwind.config.ts","tailwind.config.js")
$tailwindFound = $false
foreach($f in $tailwindFiles){
    if(Test-Path $f){
        $tailwindFound = $true
        $content = Get-Content $f -Raw
        Write-Host "Found: $f" -ForegroundColor Green
        if($content -match 'darkMode'){
            Write-Host "  darkMode setting: DETECTED" -ForegroundColor Green
            $lines = $content -split "`n"
            $lines | Where-Object { $_ -match 'darkMode' } | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
        } else {
            Write-Host "  darkMode setting: MISSING" -ForegroundColor Red
        }
    }
}
if(-not $tailwindFound){ Write-Host "No tailwind config found!" -ForegroundColor Red }

# 3. Check globals.css for CSS variables / dark class
Write-Host "`n--- 3. GLOBALS.CSS ---" -ForegroundColor Yellow
$cssPath = "src/app/globals.css"
if(Test-Path $cssPath){
    $css = Get-Content $cssPath -Raw
    Write-Host "Found: $cssPath" -ForegroundColor Green
    if($css -match 'dark'){ Write-Host "  'dark' references: DETECTED" -ForegroundColor Green } else { Write-Host "  'dark' references: NONE" -ForegroundColor Red }
    if($css -match ':root'){ Write-Host "  CSS variables (:root): DETECTED" -ForegroundColor Green } else { Write-Host "  CSS variables (:root): NONE" -ForegroundColor Red }
} else {
    Write-Host "MISSING: $cssPath" -ForegroundColor Red
}

# 4. Check for ThemeProvider in layout
Write-Host "`n--- 4. THEME PROVIDER ---" -ForegroundColor Yellow
$layoutPath = "src/app/layout.tsx"
if(Test-Path $layoutPath){
    $layout = Get-Content $layoutPath -Raw
    Write-Host "Found: $layoutPath" -ForegroundColor Green
    if($layout -match 'ThemeProvider'){ 
        Write-Host "  ThemeProvider import/usage: DETECTED" -ForegroundColor Green 
        $lines = $layout -split "`n"
        $lines | Where-Object { $_ -match 'ThemeProvider|theme' } | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    } else { 
        Write-Host "  ThemeProvider: MISSING" -ForegroundColor Red 
    }
} else {
    Write-Host "MISSING: $layoutPath" -ForegroundColor Red
}

# 5. Check for theme toggle component
Write-Host "`n--- 5. THEME TOGGLE COMPONENT ---" -ForegroundColor Yellow
$togglePatterns = @(
    "src/components/theme-toggle*",
    "src/components/ui/theme-toggle*",
    "src/components/mode-toggle*",
    "src/app/components/theme-toggle*"
)
$toggleFound = $false
foreach($p in $togglePatterns){
    $matches = Get-ChildItem -Path $p -ErrorAction SilentlyContinue
    if($matches){
        $toggleFound = $true
        Write-Host "Found toggle component: $($matches.FullName)" -ForegroundColor Green
    }
}
if(-not $toggleFound){ Write-Host "Theme toggle component: NOT FOUND" -ForegroundColor Red }

# 6. Check if toggle is used in Navbar/Header
Write-Host "`n--- 6. NAVBAR / HEADER USAGE ---" -ForegroundColor Yellow
$navPaths = @("src/components/navbar*","src/components/header*","src/components/Navbar*","src/components/Header*","src/app/components/navbar*")
$navFound = $false
foreach($p in $navPaths){
    $files = Get-ChildItem -Path $p -ErrorAction SilentlyContinue
    foreach($file in $files){
        $navFound = $true
        $content = Get-Content $file.FullName -Raw
        Write-Host "Checking: $($file.FullName)" -ForegroundColor Green
        if($content -match 'ThemeToggle|ModeToggle|theme-toggle|mode-toggle|useTheme'){
            Write-Host "  Theme toggle usage: DETECTED" -ForegroundColor Green
        } else {
            Write-Host "  Theme toggle usage: NOT FOUND" -ForegroundColor Red
        }
    }
}
if(-not $navFound){ Write-Host "No navbar/header component found!" -ForegroundColor Red }

# 7. Check components.json (shadcn) for baseColor
Write-Host "`n--- 7. SHADCN BASE COLOR ---" -ForegroundColor Yellow
if(Test-Path "components.json"){
    $shadcn = Get-Content "components.json" -Raw | ConvertFrom-Json
    Write-Host "shadcn baseColor: $($shadcn.baseColor)" -ForegroundColor Green
} else {
    Write-Host "components.json: NOT FOUND" -ForegroundColor Red
}

# 8. Git log
Write-Host "`n--- 8. GIT HISTORY (theme-related files) ---" -ForegroundColor Yellow
$themeFiles = @("src/components/theme-toggle.tsx","src/components/mode-toggle.tsx","src/app/providers.tsx","src/components/providers/theme-provider.tsx")
foreach($f in $themeFiles){
    if(Test-Path $f){
        $log = git log --oneline -1 -- $f 2>$null
        if($log){
            Write-Host "$f last modified: $log" -ForegroundColor Green
        } else {
            Write-Host "$f exists but no git history (untracked)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "$f does not exist" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  AUDIT COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nCopy the FULL output above and paste it back to me.`n" -ForegroundColor White
