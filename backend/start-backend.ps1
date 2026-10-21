# Lance le backend NestJS en mode développement (watch).
#
# La connexion PostgreSQL (DATABASE_URL) est lue depuis backend/.env :
# aucune valeur secrète ne doit être écrite en clair dans ce script.
# Créer backend/.env (non suivi par Git) et y définir DATABASE_URL.
Set-Location -LiteralPath (Split-Path -Parent $MyInvocation.MyCommand.Path)

if (-not (Test-Path -LiteralPath ".env")) {
    Write-Error "Fichier backend/.env manquant. Créer backend/.env et définir DATABASE_URL."
    exit 1
}

corepack yarn start:dev
