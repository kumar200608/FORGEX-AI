$ErrorActionPreference = "Stop"

$ws = "c:\Users\tharu\Downloads\erodde"
$td = "c:\Users\tharu\Downloads\erodde\scratch\forgex_nexgen"

if (Test-Path $td) {
    Remove-Item -Recurse -Force $td
}

New-Item -ItemType Directory -Force -Path $td | Out-Null

Write-Host "Cloning upstream repo..."
git clone https://github.com/kumar200608/FORGEX-AI.git $td

Set-Location $td

Write-Host "Creating project branch AI-FieldSync-Nexgen..."
git checkout -b AI-FieldSync-Nexgen
git remote add fork https://github.com/Tharun4743/FORGEX-AI.git

Write-Host "Copying project files..."
robocopy $ws $td /E /XD .git node_modules dist dev-dist scratch .vscode supabase\.temp /XF .env .env.local cloudflared.exe *.tsbuildinfo *.log *.aux *.blg *.synctex.gz

Write-Host "Staging and committing..."
git add -A
git commit -m "feat: add FieldSync offline-first collaborative inspection platform"

Write-Host "Pushing branch to Tharun4743/FORGEX-AI..."
git push -u fork AI-FieldSync-Nexgen --force

Write-Host "Done!"
