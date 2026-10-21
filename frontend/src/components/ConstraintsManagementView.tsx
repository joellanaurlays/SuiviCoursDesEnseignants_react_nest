import React, { useState } from 'react';
import {
  ShieldAlert,
  Plus,
  UserX,
  Building,
  Calendar,
  AlertCircle,
  CheckCircle,
  Trash2,
  Lock,
  SlidersHorizontal
} from 'lucide-react';
import {
  ConstraintPriority,
  ConstraintTargetType,
  ContraintePlanificationEntity,
  CurrentUserSession,
  DayOfWeek,
  EnseignementEntity,
  SalleEntity
} from '../types/schedule';
import { ApiClient } from '../services/apiClient';

interface ConstraintsManagementViewProps {
  constraints: ContraintePlanificationEntity[];
  setConstraints: React.Dispatch<React.SetStateAction<ContraintePlanificationEntity[]>>;
  rooms: SalleEntity[];
  teachings: EnseignementEntity[];
  currentUser: CurrentUserSession;
}

export const ConstraintsManagementView: React.FC<ConstraintsManagementViewProps> = ({
  constraints,
  setConstraints,
  rooms,
  teachings,
  currentUser
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Constraint form
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ConstraintTargetType>('ENSEIGNANT');
  const [priority, setPriority] = useState<ConstraintPriority>('BLOQUANTE');
  const [targetName, setTargetName] = useState('');
  const [targetId, setTargetId] = useState<number | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [day, setDay] = useState<DayOfWeek>('Vendredi');

  const handleToggleActive = async (constraintId: number) => {
    const current = constraints.find(item => item.id === constraintId);
    if (!current) return;
    try {
      const updated = await ApiClient.toggleConstraint(constraintId, !current.active);
      setConstraints(prev => prev.map(item => item.id === constraintId ? updated : item));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Impossible de modifier cette contrainte.');
    }
  };

  const handleDeleteConstraint = async (constraintId: number) => {
    try {
      await ApiClient.deleteConstraint(constraintId);
      setConstraints(prev => prev.filter(item => item.id !== constraintId));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Impossible de supprimer cette contrainte.');
    }
  };

  const handleAddConstraint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newConstraint: Partial<ContraintePlanificationEntity> = {
      titre: title,
      typeContrainte: type,
      niveauPriorite: priority,
      cibleId: targetId,
      cibleNom: targetName || 'Global EMIT',
      description: description,
      regle: {
        jourSemaine: day
      },
      active: true
    };

    try {
      const created = await ApiClient.createConstraint(newConstraint);
      setConstraints(prev => [...prev, created]);
      setIsAddModalOpen(false);
      setTitle('');
      setDescription('');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Impossible de créer cette contrainte.');
    }
  };

  const getTypeIcon = (cType: ConstraintTargetType) => {
    switch (cType) {
      case 'ENSEIGNANT':
        return <UserX className="w-4 h-4 text-[#0077B6]" />;
      case 'SALLE':
        return <Building className="w-4 h-4 text-[#00B4D8]" />;
      case 'NIVEAU':
        return <Calendar className="w-4 h-4 text-indigo-600" />;
      case 'GLOBAL':
        return <Lock className="w-4 h-4 text-[#03045E]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#03045E]">Gestion des Contraintes de Planification </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#CAF0F8] text-[#0077B6] font-semibold">
              Moteur de règles
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Définissez les indisponibilités des enseignants, exigences d'équipements de salles et seuils horaires des niveaux d'études.
          </p>
        </div>

        {(currentUser.role === 'CHEF_SCOLARITE' || currentUser.role === 'ADMINISTRATEUR') && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#0077B6] hover:bg-[#03045E] text-white text-xs font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Contrainte</span>
          </button>
        )}
      </div>

      {/* Constraints List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {constraints.map(constraint => (
          <div
            key={constraint.id}
            className={`p-5 rounded-2xl border transition shadow-sm flex flex-col justify-between ${
              constraint.active
                ? 'bg-white border-slate-200 hover:border-[#0077B6]/50'
                : 'bg-slate-50/70 border-slate-200 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-slate-100">
                    {getTypeIcon(constraint.typeContrainte)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {constraint.typeContrainte} • {constraint.cibleNom}
                    </span>
                    <h3 className="font-bold text-sm text-[#03045E] mt-0.5">
                      {constraint.titre}
                    </h3>
                  </div>
                </div>

                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                  constraint.niveauPriorite === 'BLOQUANTE'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {constraint.niveauPriorite === 'BLOQUANTE' ? 'Strict (Bloquante)' : 'Souhait (Préférentielle)'}
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                {constraint.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={constraint.active}
                  onChange={() => handleToggleActive(constraint.id)}
                  disabled={currentUser.role === 'ETUDIANT'}
                  className="rounded text-[#0077B6] focus:ring-[#0077B6]"
                />
                <span className="font-semibold text-slate-700">
                  {constraint.active ? 'Contrainte Active' : 'Contrainte Désactivée'}
                </span>
              </label>

              {(currentUser.role === 'CHEF_SCOLARITE' || currentUser.role === 'ADMINISTRATEUR') && (
                <button
                  onClick={() => handleDeleteConstraint(constraint.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 transition"
                  title="Supprimer la règle"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: ADD CONSTRAINT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#03045E]">
                Ajouter une Contrainte de Planification
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddConstraint} className="py-4 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Intitulé de la Contrainte *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Indisponibilité du Mercredi après-midi..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077B6]/30 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Type de Cible *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ConstraintTargetType)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077B6]/30 font-medium"
                  >
                    <option value="ENSEIGNANT">Enseignant</option>
                    <option value="SALLE">Salle</option>
                    <option value="NIVEAU">Niveau d'étude</option>
                    <option value="GLOBAL">Global / Établissement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Niveau de Priorité *</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as ConstraintPriority)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077B6]/30 font-medium"
                  >
                    <option value="BLOQUANTE">Bloquante (Interdiction stricte)</option>
                    <option value="PREFERENTIELLE">Préférentielle (Avertissement)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Entité Concernée (Nom) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dr. Randria, Amphi A, ou L1 Informatique..."
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077B6]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jour concerné par l'indisponibilité</label>
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value as DayOfWeek)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077B6]/30 font-medium"
                >
                  <option value="Lundi">Lundi</option>
                  <option value="Mardi">Mardi</option>
                  <option value="Mercredi">Mercredi</option>
                  <option value="Jeudi">Jeudi</option>
                  <option value="Vendredi">Vendredi</option>
                  <option value="Samedi">Samedi</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Motif *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Expliquer la contrainte..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077B6]/30"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#03045E] hover:bg-[#0077B6] text-white font-bold transition shadow-md"
                >
                  Ajouter la contrainte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
