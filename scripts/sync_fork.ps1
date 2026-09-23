$ErrorActionPreference = "Stop"

$ws = "c:\Users\tharu\Downloads\erodde"
$td = "c:\Users\tharu\Downloads\erodde\scratch\forgex_sync"

if (Test-Path $td) { Remove-Item -Recurse -Force $td }
New-Item -ItemType Directory -Force -Path $td | Out-Null

Write-Host "Cloning AI-FieldSync-Nexgen branch..."
git clone -b AI-FieldSync-Nexgen https://github.com/Tharun4743/FORGEX-AI.git $td

Write-Host "Copying fresh workspace files..."
robocopy $ws $td /E /XD .git node_modules dist dev-dist scratch .vscode supabase\.temp /XF .env .env.local cloudflared.exe *.tsbuildinfo *.log *.aux *.blg *.synctex.gz

Set-Location $td
Write-Host "Staging and committing..."
git add -A
$status = git status --porcelain
if ($status) {
    git commit -m "docs: update repository links to mailanupuda/fieldsync and finalize IEEE LaTeX report"
    git push origin AI-FieldSync-Nexgen
} else {
    Write-Host "Already clean and up to date!"
}

Set-Location $ws
Remove-Item -Recurse -Force $td
Write-Host "Sync complete!"
