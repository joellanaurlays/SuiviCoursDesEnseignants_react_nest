/** Retourne la page d'accueil correspondant au rôle du compte connecté. */
export function getRoleHomePath(userOrSession) {
  if (!userOrSession) return '/login'

  switch (userOrSession.role) {
    case 'ENSEIGNANT':
      return '/enseignant/dashboard'
    case 'CHEF_SCOLARITE':
    case 'SCOLARITE':
      return '/scolarite/suivi-enseignements'
    case 'ADMINISTRATEUR':
      return '/admin/suivi-enseignements'
    case 'RESPONSABLE_LICENCE':
      return '/responsable/licence/suivi-enseignements'
    case 'RESPONSABLE_MASTER':
      return '/responsable/master/suivi-enseignements'
    case 'RESPONSABLE_MENTION':
      return userOrSession.cycles?.includes('MASTER')
        ? '/responsable/master/suivi-enseignements'
        : '/responsable/licence/suivi-enseignements'
    default:
      return '/login'
  }
}
