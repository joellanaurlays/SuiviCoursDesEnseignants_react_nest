# Sécurité des sessions — Module Utilisateurs / Authentification

## Stratégie
- Authentification par **JWT stateless** (aucune session stockée côté serveur).
- Le token est signé avec `JWT_SECRET` et expire après `JWT_EXPIRATION` (24h par défaut, configurable dans `.env`).
- Chaque requête vers une route protégée doit inclure `Authorization: Bearer <token>`.

## Protection des routes
- **Backend** : `JwtAuthGuard` sur chaque contrôleur/route sensible (`/auth/profile`, `/users/me`, etc.).
- **Frontend** : composant `ProtectedRoute` qui redirige vers `/login` si aucun utilisateur n'est authentifié.

## Expiration et déconnexion
- À l'expiration du token, toute requête API renvoie `401`. Le frontend intercepte cette réponse
  (`apiClient.js`), supprime le token local et redirige l'utilisateur vers `/login` avec un message
  "session expirée".
- La déconnexion volontaire (`/auth/logout`) est un endpoint symbolique : comme le JWT est stateless,
  il n'existe rien à invalidater côté serveur. Le token est simplement supprimé du `localStorage`
  côté client. Cet endpoint est prévu pour une éventuelle évolution future (blacklist de tokens,
  audit de connexions).

## Limites connues (hors périmètre actuel)
- Pas de refresh token : quand le token expire, l'utilisateur doit se reconnecter entièrement.
- Pas de révocation immédiate d'un token volé avant son expiration naturelle.
Ces points pourraient être ajoutés dans une itération future si le besoin est confirmé par l'équipe.