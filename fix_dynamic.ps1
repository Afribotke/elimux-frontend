$files = @(
    "src/app/accreditation-bodies/[id]/page.tsx",
    "src/app/certificates/[number]/page.tsx",
    "src/app/institutions/[id]/page.tsx",
    "src/app/internships/[id]/page.tsx",
    "src/app/internships/[id]/apply/page.tsx",
    "src/app/programs/[id]/page.tsx",
    "src/app/scholarships/[id]/page.tsx"
)
$fixed = 0
foreach ($f in $files) {
    $p = Join-Path $PWD $f
    if (Test-Path -LiteralPath $p) {
        $c = Get-Content -LiteralPath $p -Raw
        if ($c -match "export const dynamic") { Write-Host "Skip: $f" -ForegroundColor Yellow; continue }
        $lines = $c -split "`n"
        $last = -1
        for ($i=0; $i -lt $lines.Count; $i++) { if ($lines[$i] -match "^\s*import ") { $last = $i } }
        $new = [System.Collections.ArrayList]::new()
        for ($i=0; $i -lt $lines.Count; $i++) { [void]$new.Add($lines[$i]); if ($i -eq $last) { [void]$new.Add(""); [void]$new.Add("export const dynamic = 'force-dynamic'"); [void]$new.Add("") } }
        Set-Content -LiteralPath $p -Value ($new -join "`n") -Encoding UTF8 -NoNewline
        Write-Host "Fixed: $f" -ForegroundColor Green
        $fixed++
    } else { Write-Host "Missing: $f" -ForegroundColor Red }
}
Write-Host "`nFixed: $fixed files" -ForegroundColor Cyan
