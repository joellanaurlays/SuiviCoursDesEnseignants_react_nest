import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../../../components/Layout';
import { Info } from 'lucide-react';
import { useAuth } from '../../../../auth/AuthContext';
import { enseignementService } from '../../../../services/enseignement.service';
import { seanceService } from '../../../../services/seance.service';
import { EnseignementAvecSuivi, StatutSeance } from '../../../../types/enseignement';

export default function DeclarerSeance() {
  const navigate = useNavigate();
  const { headers } = useAuth();

  const [enseignements, setEnseignements] = useState<EnseignementAvecSuivi[]>([]);
  const [chargementEnseignements, setChargementEnseignements] = useState(true);
  const [enseignementId, setEnseignementId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [heureDebut, setHeureDebut] = useState('08:30');
  const [heureFin, setHeureFin] = useState('10:00');
  const [contenu, setContenu] = useState('');
  const [statut, setStatut] = useState<StatutSeance>('REALISEE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setChargementEnseignements(true);
    enseignementService
      .list(headers)
      .then((data) => {
        if (cancelled) return;
        setEnseignements(data);
        if (data.length > 0) {
          setEnseignementId(data[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Impossible de charger vos enseignements.');
      })
      .finally(() => {
        if (!cancelled) setChargementEnseignements(false);
      });
    return () => {
      cancelled = true;
    };
  }, [headers]);

  const calculateDuration = () => {
    if (!heureDebut || !heureFin) return '0h 0m';
    const [h1, m1] = heureDebut.split(':').map(Number);
    const [h2, m2] = heureFin.split(':').map(Number);
    const diff = h2 * 60 + m2 - (h1 * 60 + m1);
    if (diff < 0) return '0h 0m';
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h ${m}m`;
  };

  const handleEnregistrer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enseignementId) {
      setError('Veuillez sélectionner une matière.');
      return;
    }
    if (heureFin <= heureDebut) {
      setError("L'heure de fin doit être postérieure à l'heure de début.");
      return;
    }
    if (statut === 'REALISEE' && contenu.trim().length === 0) {
      setError('Le contenu enseigné est obligatoire pour déclarer une séance réalisée.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await seanceService.create(
        {
          enseignementId,
          dateSeance: new Date(date).toISOString(),
          heureDebut,
          heureFin,
          contenuEnseigne: contenu,
          statut,
        },
        headers,
      );
      navigate('/enseignant/seances');
    } catch (err) {
      const message = (err as { message?: string }).message;
      setError(message ?? "Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff]';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold text-[#0a0a32]">
          <span className="text-gray-500 cursor-pointer hover:text-gray-700" onClick={() => navigate('/enseignant/seances')}>
            Mes séances
          </span>{' '}
          › Déclarer une séance
        </h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-4xl">
        <h2 className="text-xl font-bold text-[#0a0a32] mb-2">Déclarer une nouvelle séance</h2>
        <p className="text-sm text-gray-500 mb-6">
          Heures réalisées, progression et état sont recalculés automatiquement par le backend.
        </p>

        {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">{error}</div>}

        {chargementEnseignements ? (
          <p className="text-gray-500 py-8 text-center">Chargement de vos enseignements...</p>
        ) : enseignements.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucun enseignement ne vous est affecté. Vous ne pouvez pas déclarer de séance.
          </div>
        ) : (
          <form onSubmit={handleEnregistrer} className="space-y-6">
            <div>
              <label className={labelClass}>Matière d'enseignement *</label>
              <select
                value={enseignementId}
                onChange={(e) => setEnseignementId(e.target.value)}
                className={inputClass}
                required
              >
                <option value="" disabled>
                  Sélectionner une matière
                </option>
                {enseignements.map((ens) => (
                  <option key={ens.id} value={ens.id}>
                    {ens.matiere} ({ens.niveau} - {ens.parcours})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Date de la séance *</label>
              <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Heure début *</label>
                <input type="time" className={inputClass} value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} required />
              </div>
              <div>
                <label className={labelClass}>Heure fin *</label>
                <input type="time" className={inputClass} value={heureFin} onChange={(e) => setHeureFin(e.target.value)} required />
              </div>
            </div>

            <div className="bg-cyan-50 text-[#006688] p-3 rounded-md flex items-center space-x-2 text-sm border border-cyan-100">
              <Info size={16} className="text-[#0088aa]" />
              <span>
                Durée calculée automatiquement : <span className="font-bold">{calculateDuration()}</span>
              </span>
            </div>

            <div>
              <label className={labelClass}>Statut de la séance</label>
              <select value={statut} onChange={(e) => setStatut(e.target.value as StatutSeance)} className={inputClass}>
                <option value="REALISEE">Réalisée (comptabilisée dans les heures)</option>
                <option value="PLANIFIEE">Planifiée (programmée, non comptabilisée)</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Contenu enseigné {statut === 'REALISEE' ? '*' : '(facultatif pour une séance planifiée)'}
              </label>
              <textarea
                className={`${inputClass} min-h-[120px]`}
                placeholder="Décrivez le contenu abordé durant cette séance..."
                value={contenu}
                onChange={(e) => setContenu(e.target.value)}
                required={statut === 'REALISEE'}
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/enseignant/seances')}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#0088aa] text-white rounded-md hover:bg-[#007799] font-medium disabled:opacity-50"
              >
                {loading ? 'Enregistrement...' : 'Enregistrer la séance'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}