import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, saveSession, setToken } from '../services/auth.service';
import { profileToSession } from '../auth/identities';
import { RoleProfile, UserRole } from '../types/enseignement';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function pathForRole(role: UserRole): string {
    switch (role) {
      case 'SCOLARITE':
        return '/scolarite/suivi-enseignements';
      case 'ADMINISTRATEUR':
        return '/admin/suivi-enseignements';
      case 'RESPONSABLE_MENTION':
        return '/responsable/licence/suivi-enseignements';
      default:
        return '/enseignant/enseignements';
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { accessToken, user } = await login(email, password);
      const profile: RoleProfile = {
        key: `user-${user.id}`,
        label: user.email,
        role: user.role as UserRole,
        userId: user.id,
        description: 'Connexion via email/mot de passe',
      };
      saveSession(profileToSession(profile));
      setToken(accessToken);
      navigate(pathForRole(user.role as UserRole), { replace: true });
    } catch (err: any) {
      setError(err.message ?? 'Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 p-6 bg-white rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">EMIT — Connexion</h1>
          <p className="text-gray-600">Suivi et pilotage des enseignants</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Adresse email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md disabled:opacity-50 hover:bg-blue-700 transition"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <p className="text-xs text-gray-500 text-center">
          Compte démo : scolarite@emit.mg / Scolarite123!
        </p>
      </div>
    </div>
  );
}