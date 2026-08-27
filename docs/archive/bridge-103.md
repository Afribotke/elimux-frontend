# ============================================================
# FIX SCRIPT: Year of Study Input + Login Email Color
# ============================================================

$frontend = "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
Set-Location $frontend

Write-Host "`n=== FIX 1: Year of Study — Remove Hardcoded Value ===" -ForegroundColor Cyan

# Find files containing "Year of Study" or yearOfStudy
$yearFiles = Get-ChildItem -Recurse -File -Include *.tsx,*.ts,*.jsx,*.js | Select-String -Pattern "Year of Study|yearOfStudy|year_of_study" -List | Select-Object -ExpandProperty Path -Unique

if (-not $yearFiles) {
    Write-Host "WARNING: No files found with 'Year of Study' — trying broader search..." -ForegroundColor Yellow
    $yearFiles = Get-ChildItem -Recurse -File -Include *.tsx,*.ts,*.jsx,*.js | Select-String -Pattern "year.*study|Year.*Study" -List | Select-Object -ExpandProperty Path -Unique
}

Write-Host "Found candidate files:" -ForegroundColor Green
$yearFiles | ForEach-Object { Write-Host "  $_" }

foreach ($file in $yearFiles) {
    $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }

    # Fix 1a: Remove hardcoded value="1" or defaultValue="1" on year inputs
    # Pattern: input with name/id containing year and value="1"
    $fixed = $content -replace '(?i)(name=["'']?year[^"''\s]*["'']?|id=["'']?year[^"''\s]*["'']?)\s+value=["'']1["'']', '$1'
    $fixed = $fixed -replace '(?i)(name=["'']?year[^"''\s]*["'']?|id=["'']?year[^"''\s]*["'']?)\s+defaultValue=["'']1["'']', '$1'

    # Fix 1b: If it's a select dropdown hardcoded to 1, make it a proper number input
    # Convert <select> with only <option value="1"> to <input type="number">
    if ($fixed -match '(?s)<select[^>]*year[^>]*>.*?<option[^>]*value=["'']1["''][^>]*>1</option>.*?</select>') {
        $fixed = $fixed -replace '(?s)<select([^>]*name=["'']?year[^"''\s]*["'']?[^>]*)>.*?</select>', '<input$1 type="number" min="1" max="6" placeholder="e.g. 1" className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />'
        Write-Host "  [FIXED] Converted hardcoded <select> to <input type=number> in: $file" -ForegroundColor Green
    }

    # Fix 1c: Remove readOnly or disabled attributes from year input
    $fixed = $fixed -replace '(?i)(<input[^>]*year[^>]*)\s+readOnly', '$1'
    $fixed = $fixed -replace '(?i)(<input[^>]*year[^>]*)\s+disabled', '$1'

    # Fix 1d: If value is hardcoded to "1" via state default, change to empty string
    $fixed = $fixed -replace '(?i)(useState\s*\(\s*)["'']1["'']', '${1}""'

    if ($fixed -ne $content) {
        Set-Content $file $fixed -NoNewline
        Write-Host "  [FIXED] Year of Study input in: $file" -ForegroundColor Green
    } else {
        Write-Host "  [OK] No hardcoded year fix needed in: $file" -ForegroundColor DarkGray
    }
}

Write-Host "`n=== FIX 2: Login Email — Fix Invisible Text on Focus/Hover ===" -ForegroundColor Cyan

# Find login page files
$loginFiles = Get-ChildItem -Recurse -File -Include *.tsx,*.ts,*.jsx,*.js | Select-String -Pattern "login|signin|sign-in" -List | Select-Object -ExpandProperty Path -Unique
$loginFiles += Get-ChildItem -Recurse -Path "*/login/*","*/auth/*" -File -Include *.tsx,*.ts,*.jsx,*.js -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName

$loginFiles = $loginFiles | Select-Object -Unique

Write-Host "Found login candidate files:" -ForegroundColor Green
$loginFiles | ForEach-Object { Write-Host "  $_" }

foreach ($file in $loginFiles) {
    $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }

    $fixed = $content

    # Fix 2a: Ensure email input has explicit text color that persists on focus
    # Look for email input and ensure className includes text-white or text-gray-900
    if ($fixed -match '(?i)<input[^>]*type=["'']?email["'']?[^>]*>') {
        # If the input has a className without explicit text color, add text-white
        $fixed = $fixed -replace '(?i)(<input[^>]*type=["'']?email["'']?[^>]*className=["''])([^"''"]*)(?!.*text-)([^"''"]*["''])', '$1$2 text-white $3'
        # Ensure focus state doesn't turn text transparent or same as bg
        $fixed = $fixed -replace '(?i)focus:text-transparent', 'focus:text-white'
        $fixed = $fixed -replace '(?i)focus:bg-white\s+focus:text-white', 'focus:bg-white focus:text-gray-900'
    }

    # Fix 2b: Fix CSS-in-JS or style objects that might cause invisible text
    # Common dark-mode bug: focus:bg-gray-900 focus:text-gray-900 (same color)
    $fixed = $fixed -replace '(?i)focus:bg-gray-900\s+focus:text-gray-900', 'focus:bg-gray-900 focus:text-white'
    $fixed = $fixed -replace '(?i)focus:bg-black\s+focus:text-black', 'focus:bg-black focus:text-white'

    # Fix 2c: If using Tailwind, ensure placeholder and text colors are distinct from bg
    $fixed = $fixed -replace '(?i)placeholder-gray-500\s+text-gray-500', 'placeholder-gray-500 text-white'
    $fixed = $fixed -replace '(?i)placeholder-gray-400\s+text-gray-400', 'placeholder-gray-400 text-white'

    # Fix 2d: Check for inline styles that set color same as background on focus
    $fixed = $fixed -replace '(?i)onFocus=\{[^}]*color:\s*["''']?#1f2937["''']?[^}]*\}', ''
    $fixed = $fixed -replace '(?i)onFocus=\{[^}]*color:\s*["''']?black["''']?[^}]*\}', ''

    if ($fixed -ne $content) {
        Set-Content $file $fixed -NoNewline
        Write-Host "  [FIXED] Login email color in: $file" -ForegroundColor Green
    } else {
        Write-Host "  [OK] No email color fix needed in: $file" -ForegroundColor DarkGray
    }
}

Write-Host "`n=== FIX 3: Global CSS — Ensure Input Focus States Are Visible ===" -ForegroundColor Cyan

$cssFiles = Get-ChildItem -Recurse -File -Include *.css,*.scss,*.less,*.module.css | Select-Object -ExpandProperty FullName
$globalCss = $cssFiles | Where-Object { $_ -match "globals?\." -or $_ -match "styles?\." }

foreach ($file in $globalCss) {
    $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }

    $fixed = $content

    # Fix global input focus styles that might hide text
    $fixed = $fixed -replace '(?is)(input\[type=["'']?email["'']?\]:focus\s*\{[^}]*?)color:\s*[^;]+;', '$1color: #ffffff;'
    $fixed = $fixed -replace '(?is)(input:focus\s*\{[^}]*?)color:\s*[^;]+;', '$1color: #ffffff;'

    if ($fixed -ne $content) {
        Set-Content $file $fixed -NoNewline
        Write-Host "  [FIXED] Global CSS input focus in: $file" -ForegroundColor Green
    }
}

Write-Host "`n=== BUILD & VERIFY ===" -ForegroundColor Cyan
npm run build 2>&1 | Tee-Object -FilePath "$frontend\build-log.txt" | Select-Object -Last 20

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nBUILD SUCCESS — ready to commit." -ForegroundColor Green
} else {
    Write-Host "`nBUILD FAILED — check build-log.txt" -ForegroundColor Red
}
What this script does:
Year of Study — Searches all .tsx/.ts files for anything matching "year of study", then:
Removes hardcoded value="1" or defaultValue="1"
Removes readOnly / disabled attributes
Converts a hardcoded <select> with only option "1" into a proper <input type="number">
Fixes useState("1") defaults to useState("")
Login Email Color — Searches login/auth files and:
Ensures email inputs have explicit text-white class
Removes focus:text-transparent or same-color-as-background combinations
Fixes focus:bg-gray-900 focus:text-gray-900 → focus:bg-gray-900 focus:text-white
Cleans inline onFocus styles that set invisible colors
Global CSS — Checks globals.css / styles.css for input focus color rules that might override to invisible.
Run it, then report back the file paths it modified and the build result.