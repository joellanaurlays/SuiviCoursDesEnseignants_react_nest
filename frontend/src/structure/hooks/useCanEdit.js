import { useAuth } from '../../context/AuthContext.jsx';

/** Seul le chef de scolarité peut créer, modifier ou supprimer (cf. @Roles côté API). */
export function useCanEdit() {
  const { user } = useAuth();
  return user?.role === 'CHEF_SCOLARITE';
}
