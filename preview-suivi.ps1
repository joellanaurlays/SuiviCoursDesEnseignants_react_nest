<#
.SYNOPSIS
  Lance la previsualisation locale du module "Suivi des enseignements".

.DESCRIPTION
  Commande unique, utilisable depuis PowerShell quelle que soit la position
  courante : elle demarre le backend (si le port 3000 est libre) puis Vite
  avec le mode de previsualisation local active, et affiche l'URL reelle a
  ouvrir sur la route /enseignant/seances.

  Le mode de previsualisation est un mode de DEVELOPPEMENT LOCAL :
  - il n'existe qu'avec import.meta.env.DEV et VITE_ENABLE_LOCAL_PREVIEW=true ;
  - il ne fabrique aucun jeton JWT et ne desactive aucun guard du backend ;
  - les actions sont simulees en memoire : PostgreSQL n'est jamais modifie ;
  - il ne peut pas etre active dans un build de production.

  REMARQUE : ce fichier est volontairement en ASCII pur. PowerShell 5.1
  relit les fichiers sans BOM avec l'encodage systeme, ce qui casse les
  caracteres accentues et les tirets cadratins.

.EXAMPLE
  .\preview-suivi.ps1
#>

$ErrorActionPreference = 'Stop'

$racine = Split-Path -Parent $MyInvocation.MyCommand.Path
$script = Join-Path $racine 'frontend\scripts\preview-suivi.mjs'

if (-not (Test-Path -LiteralPath $script)) {
  Write-Error "Script de previsualisation introuvable : $script"
  exit 1
}

Write-Host ""
Write-Host "=== Previsualisation locale - Suivi des enseignements ===" -ForegroundColor Cyan
Write-Host "Racine du projet : $racine" -ForegroundColor DarkGray
Write-Host ""

& node $script
exit $LASTEXITCODE
