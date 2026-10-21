module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  rules: {
    // Regle de confort de developpement (granularite du rechargement a chaud
    // uniquement) : ce projet exporte volontairement un composant et son hook
    // dans le meme fichier (AuthContext.tsx), ou un helper avec son composant.
    'react-refresh/only-export-components': 'off',
  },
};
