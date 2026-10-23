Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "Demarrage complet : Suivi des Enseignants - EMIT" -ForegroundColor Cyan
Write-Host "Branche : feature/teaching-progress" -ForegroundColor Yellow
Write-Host "Dossier : Stage-equipe-final" -ForegroundColor Yellow
Write-Host "=========================================================" -ForegroundColor Cyan

$racine = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath (Join-Path $racine "frontend")
corepack yarn dev
