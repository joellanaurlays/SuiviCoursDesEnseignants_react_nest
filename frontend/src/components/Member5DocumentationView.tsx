import React, { useState } from 'react';
import {
  BookOpen,
  Layers,
  Database,
  Cpu,
  GitBranch,
  CheckCircle2,
  Code2,
  Workflow,
  ShieldCheck,
  FileText,
  Boxes,
  Network
} from 'lucide-react';

export const Member5DocumentationView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'taches' | 'uml' | 'api' | 'bdd' | 'tests'>('taches');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#0077B6]">
                Dossier d'Architecture & Conception UML
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#03045E] text-white font-bold">
                Membre 5 • 400 / 400 pts
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-[#03045E] mt-1">
              Module Emploi du Temps — Spécifications & Modélisation
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Conformément au cahier des charges et à la modélisation UML de l'application de suivi des enseignements de l'EMIT.
            </p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveSection('taches')}
              className={`px-3 py-1.5 rounded-lg transition ${activeSection === 'taches' ? 'bg-[#03045E] text-white' : 'hover:text-slate-900'}`}
            >
              5 Tâches (T21-T25)
            </button>
            <button
              onClick={() => setActiveSection('uml')}
              className={`px-3 py-1.5 rounded-lg transition ${activeSection === 'uml' ? 'bg-[#03045E] text-white' : 'hover:text-slate-900'}`}
            >
              Diagrammes UML
            </button>
            <button
              onClick={() => setActiveSection('api')}
              className={`px-3 py-1.5 rounded-lg transition ${activeSection === 'api' ? 'bg-[#03045E] text-white' : 'hover:text-slate-900'}`}
            >
              Endpoints API
            </button>
            <button
              onClick={() => setActiveSection('bdd')}
              className={`px-3 py-1.5 rounded-lg transition ${activeSection === 'bdd' ? 'bg-[#03045E] text-white' : 'hover:text-slate-900'}`}
            >
              Modèle BDD
            </button>
            <button
              onClick={() => setActiveSection('tests')}
              className={`px-3 py-1.5 rounded-lg transition ${activeSection === 'tests' ? 'bg-[#03045E] text-white' : 'hover:text-slate-900'}`}
            >
              Tests & Conflits
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: 5 TÂCHES DE MEMBRE 5 (400 POINTS) */}
      {activeSection === 'taches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* T21 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#0077B6]">T21</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700">80 pts • Haute</span>
              </div>
              <h3 className="font-extrabold text-sm text-[#03045E] mt-2">
                Gestion des Salles et Créneaux
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Modèle `Salle` (nom, capacité, type AMPHI/TP/TD/LABO, équipements, statut opérationnel). Découpage des créneaux de 2h de l'EMIT du Lundi au Samedi.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-700 font-semibold">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Réalisé à 100%
              </span>
              <span className="text-slate-400">CRUD + Filtres</span>
            </div>
          </div>

          {/* T22 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#0077B6]">T22</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700">100 pts • Très haute</span>
              </div>
              <h3 className="font-extrabold text-sm text-[#03045E] mt-2">
                Construction de l'Emploi du Temps
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Génération automatique sans conflit via l’API de planification & planification manuelle assistée. Prise en compte des volumes horaires et semestres chargés depuis PostgreSQL.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-700 font-semibold">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Réalisé à 100%
              </span>
              <span className="text-slate-400">Algorithme + Manuel</span>
            </div>
          </div>

          {/* T23 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#0077B6]">T23</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700">95 pts • Très haute</span>
              </div>
              <h3 className="font-extrabold text-sm text-[#03045E] mt-2">
                Détection Temps Réel des Conflits
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Moteur de contrôle tripartite : Salle occupée simultanément, Enseignant en double réservation, Promotion avec deux cours simultanés. Simulation HTTP 409.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-700 font-semibold">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Réalisé à 100%
              </span>
              <span className="text-slate-400">Centre d'audit & auto-résolution</span>
            </div>
          </div>

          {/* T24 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#0077B6]">T24</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700">65 pts • Haute</span>
              </div>
              <h3 className="font-extrabold text-sm text-[#03045E] mt-2">
                Consultation de l'Emploi du Temps
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Grille interactive universitaire (vue semaine, vue jour, vue liste), filtrage dynamique par niveau, par enseignant et par salle. Export iCal & Impression.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-700 font-semibold">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Réalisé à 100%
              </span>
              <span className="text-slate-400">Multi-vues & Exports</span>
            </div>
          </div>

          {/* T25 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#0077B6]">T25</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700">60 pts • Moyenne</span>
              </div>
              <h3 className="font-extrabold text-sm text-[#03045E] mt-2">
                Contraintes de Planification
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Prise en compte des contraintes métiers : indisponibilités récurrentes des enseignants, matériel requis pour les TP, plafonds horaires des promotions.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-700 font-semibold">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Réalisé à 100%
              </span>
              <span className="text-slate-400">Règles Bloquantes / Soft</span>
            </div>
          </div>

          {/* Synthèse globale */}
          <div className="bg-gradient-to-br from-[#03045E] to-[#0077B6] rounded-2xl p-5 text-white shadow-md flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-[#90E0EF] uppercase tracking-wider">Bilan Membre 5</span>
              <h3 className="text-xl font-extrabold mt-1">400 / 400 Points</h3>
              <p className="text-xs text-slate-200 mt-2 leading-relaxed">
                L'ensemble du périmètre Emploi du Temps est couvert de bout en bout : Analyse, Conception UML, Tables BDD, Services NestJS/TypeORM, et Interface React réactive.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/20 text-xs font-semibold text-[#CAF0F8]">
              Prêt pour intégration sur branche `feature/schedule`
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: DIAGRAMMES UML (Reproduisant fidèlement le PDF pages 30 à 39) */}
      {activeSection === 'uml' && (
        <div className="space-y-6">
          {/* 1. Cas d'utilisation */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-[#03045E] flex items-center gap-2">
              <Workflow className="w-4 h-4 text-[#0077B6]" />
              2.1 Diagramme de Cas d'Utilisation (Use Case Diagram)
            </h3>
            <p className="text-xs text-slate-600">
              Identifie les interactions entre les acteurs (Chef de Scolarité, Administrateur, Responsable de Mention, Enseignant) et le module Emploi du temps.
            </p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 space-y-1">
              <div>[Chef de Scolarité / Admin] --&gt; (Gérer les salles et les créneaux)</div>
              <div>[Chef de Scolarité / Admin] --&gt; (Gérer / Générer l'emploi du temps) &lt;&lt;include&gt;&gt; (Détecter les conflits)</div>
              <div>[Chef de Scolarité / Admin] --&gt; (Définir contraintes et disponibilités)</div>
              <div>[Tous les acteurs]           --&gt; (Consulter l'emploi du temps par niveau)</div>
              <div>[Enseignant]                 --&gt; (Consulter l'emploi du temps personnel)</div>
            </div>
          </div>

          {/* 2. Classes NestJS / TypeORM */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-[#03045E] flex items-center gap-2">
              <Boxes className="w-4 h-4 text-[#0077B6]" />
              2.2 Diagramme de Classes (NestJS / TypeORM)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50">
                <div className="font-bold text-[#03045E] pb-1 border-b border-blue-200">SalleEntity</div>
                <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                  <div>+ id: number</div>
                  <div>+ nom: string</div>
                  <div>+ capacite: number</div>
                  <div>+ typeSalle: string</div>
                  <div>+ estDisponible: boolean</div>
                  <div className="pt-1 text-[#0077B6] font-semibold">+ modifier(): void</div>
                  <div className="text-[#0077B6] font-semibold">+ desactiver(): void</div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50">
                <div className="font-bold text-[#03045E] pb-1 border-b border-blue-200">CreneauHoraireEntity</div>
                <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                  <div>+ id: number</div>
                  <div>+ jourSemaine: string</div>
                  <div>+ heureDebut: string</div>
                  <div>+ heureFin: string</div>
                  <div className="pt-1 text-[#0077B6] font-semibold">+ getDuree(): number</div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50">
                <div className="font-bold text-[#03045E] pb-1 border-b border-blue-200">SeancePlanifieeEntity</div>
                <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                  <div>+ id: number</div>
                  <div>+ dateSeance: Date</div>
                  <div>+ statut: string</div>
                  <div>+ enseignementId: number</div>
                  <div>+ enseignantId: number</div>
                  <div>+ niveauId: number</div>
                  <div className="pt-1 text-[#0077B6] font-semibold">+ verifierConflit(): boolean</div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50">
                <div className="font-bold text-[#03045E] pb-1 border-b border-blue-200">EmploiDuTempsEntity</div>
                <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                  <div>+ id: number</div>
                  <div>+ semestreId: number</div>
                  <div>+ dateMiseAJour: Date</div>
                  <div>+ estValide: boolean</div>
                  <div className="pt-1 text-[#0077B6] font-semibold">+ genererPlanning(): void</div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Activités de contrôle des 3 conditions */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-[#03045E] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0077B6]" />
              2.8 Diagramme d'Activités — Contrôle Logique d'Impossibilité et de Conflits
            </h3>
            <p className="text-xs text-slate-600">
              Séquence de vérification des 3 conditions indispensables avant d'autoriser l'enregistrement d'une séance dans PostgreSQL :
            </p>
            <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs space-y-2">
              <div className="text-[#90E0EF]">1. [Condition 1] La salle est-elle libre sur ce créneau ?</div>
              <div className="pl-4 text-rose-400">NON =&gt; Lever Conflit "Salle Occupée" =&gt; Bloquer Sauvegarde (HTTP 409)</div>
              <div className="pl-4 text-emerald-400">OUI =&gt; Passer au contrôle 2</div>

              <div className="text-[#90E0EF]">2. [Condition 2] L'enseignant est-il disponible ?</div>
              <div className="pl-4 text-rose-400">NON =&gt; Lever Conflit "Enseignant Indisponible" =&gt; Bloquer Sauvegarde (HTTP 409)</div>
              <div className="pl-4 text-emerald-400">OUI =&gt; Passer au contrôle 3</div>

              <div className="text-[#90E0EF]">3. [Condition 3] Le groupe/niveau n'a-t-il pas un autre cours simultané ?</div>
              <div className="pl-4 text-rose-400">NON =&gt; Lever Conflit "Double cours promotion" =&gt; Bloquer Sauvegarde (HTTP 409)</div>
              <div className="pl-4 text-emerald-400">OUI =&gt; 3 conditions validées =&gt; Enregistrer la séance via TypeORM (HTTP 201 Created)</div>
            </div>
          </div>

          {/* 4. États-Transitions du cycle de vie */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-[#03045E] flex items-center gap-2">
              <Workflow className="w-4 h-4 text-[#0077B6]" />
              2.7 Diagramme d'États-Transitions du cycle de vie d'une séance
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <div className="flex flex-wrap items-center gap-2 font-mono">
                <span className="px-3 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold">[Brouillon]</span>
                <span>--Vérification--&gt;</span>
                <span className="px-3 py-1 rounded-lg bg-rose-100 text-rose-900 font-bold">[En Conflit]</span>
                <span>--Résolution--&gt;</span>
                <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold">[Validé]</span>
                <span>--Publication Admin--&gt;</span>
                <span className="px-3 py-1 rounded-lg bg-[#03045E] text-white font-bold">[Planifié]</span>
                <span>--Cours dispensé (Membre 4)--&gt;</span>
                <span className="px-3 py-1 rounded-lg bg-slate-700 text-white font-bold">[Réalisé]</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: API ENDPOINTS REST (NestJS) */}
      {activeSection === 'api' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-[#03045E] flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#0077B6]" />
            Spécifications des Endpoints de l'API REST (PlanningController & RoomsController)
          </h3>
          <div className="overflow-x-auto text-xs font-mono">
            <table className="w-full text-left">
              <thead className="bg-[#03045E] text-white">
                <tr>
                  <th className="py-2.5 px-3">Méthode</th>
                  <th className="py-2.5 px-3">Endpoint</th>
                  <th className="py-2.5 px-3">Rôle Requis</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Code Réponse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-emerald-600">GET</td>
                  <td className="py-2.5 px-3">/api/planning?niveauId=&amp;semestreId=</td>
                  <td className="py-2.5 px-3 text-slate-600">Tous (Public)</td>
                  <td className="py-2.5 px-3 text-slate-800">Récupère les séances filtrées de l'EDT</td>
                  <td className="py-2.5 px-3 text-slate-700 font-bold">200 OK</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-blue-600">POST</td>
                  <td className="py-2.5 px-3">/api/planning/generate</td>
                  <td className="py-2.5 px-3 text-slate-600">Chef Scolarité / Admin</td>
                  <td className="py-2.5 px-3 text-slate-800">Génère automatiquement les cours sans conflit</td>
                  <td className="py-2.5 px-3 text-slate-700 font-bold">201 Created / 409 Conflict</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-blue-600">POST</td>
                  <td className="py-2.5 px-3">/api/planning/session</td>
                  <td className="py-2.5 px-3 text-slate-600">Chef Scolarité / Admin</td>
                  <td className="py-2.5 px-3 text-slate-800">Planifie une séance avec vérification conflit</td>
                  <td className="py-2.5 px-3 text-slate-700 font-bold">201 Created / 409 Conflict</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-amber-600">PUT</td>
                  <td className="py-2.5 px-3">/api/planning/session/:id/status</td>
                  <td className="py-2.5 px-3 text-slate-600">Admin / Enseignant</td>
                  <td className="py-2.5 px-3 text-slate-800">Change le statut (Brouillon, Validé, Réalisé)</td>
                  <td className="py-2.5 px-3 text-slate-700 font-bold">200 OK</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-emerald-600">GET</td>
                  <td className="py-2.5 px-3">/api/rooms</td>
                  <td className="py-2.5 px-3 text-slate-600">Tous</td>
                  <td className="py-2.5 px-3 text-slate-800">Liste des locaux avec équipements et disponibilité</td>
                  <td className="py-2.5 px-3 text-slate-700 font-bold">200 OK</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-blue-600">POST</td>
                  <td className="py-2.5 px-3">/api/rooms</td>
                  <td className="py-2.5 px-3 text-slate-600">Chef Scolarité / Admin</td>
                  <td className="py-2.5 px-3 text-slate-800">Ajoute une nouvelle salle</td>
                  <td className="py-2.5 px-3 text-slate-700 font-bold">201 Created</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-emerald-600">GET</td>
                  <td className="py-2.5 px-3">/api/constraints</td>
                  <td className="py-2.5 px-3 text-slate-600">Tous</td>
                  <td className="py-2.5 px-3 text-slate-800">Liste des contraintes actives</td>
                  <td className="py-2.5 px-3 text-slate-700 font-bold">200 OK</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: MODÈLE DE BASE DE DONNÉES POSTGRESQL */}
      {activeSection === 'bdd' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-[#03045E] flex items-center gap-2">
            <Database className="w-4 h-4 text-[#0077B6]" />
            Schéma SQL PostgreSQL (`suivicours_db`, configurable)
          </h3>
          <p className="text-xs text-slate-600">
            Structure des tables gérées par le Membre 5, en liaison avec les tables des autres membres :
          </p>
          <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed">
{`-- Table des Salles
CREATE TABLE salle (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    capacite INT NOT NULL,
    type_salle VARCHAR(50) NOT NULL, -- 'AMPHI', 'SALLE_TP', 'SALLE_TD', 'LABO'
    batiment VARCHAR(150),
    equipements TEXT[],
    est_disponible BOOLEAN DEFAULT TRUE,
    statut VARCHAR(30) DEFAULT 'ACTIF'
);

-- Table des Créneaux Horaires
CREATE TABLE creneau_horaire (
    id SERIAL PRIMARY KEY,
    jour_semaine VARCHAR(20) NOT NULL, -- 'Lundi', 'Mardi', etc.
    heure_debut VARCHAR(10) NOT NULL,  -- '08:00'
    heure_fin VARCHAR(10) NOT NULL,    -- '10:00'
    duree_minutes INT DEFAULT 120,
    plage VARCHAR(20) NOT NULL,
    actif BOOLEAN DEFAULT TRUE
);

-- Table Principale : Séance Planifiée
CREATE TABLE seance_planifiee (
    id SERIAL PRIMARY KEY,
    emploi_du_temps_id INT REFERENCES emploi_du_temps(id),
    enseignement_id INT REFERENCES enseignement(id), -- Membre 4
    enseignant_id INT REFERENCES enseignant(id),     -- Membre 2
    niveau_id INT REFERENCES niveau(id),             -- Membre 3
    salle_id INT REFERENCES salle(id),
    creneau_id INT REFERENCES creneau_horaire(id),
    date_seance DATE NOT NULL,
    type_seance VARCHAR(10) NOT NULL, -- 'CM', 'TD', 'TP'
    statut VARCHAR(30) DEFAULT 'BROUILLON',
    notes TEXT,
    CONSTRAINT uq_salle_creneau_date UNIQUE (salle_id, creneau_id, date_seance),
    CONSTRAINT uq_enseignant_creneau_date UNIQUE (enseignant_id, creneau_id, date_seance),
    CONSTRAINT uq_niveau_creneau_date UNIQUE (niveau_id, creneau_id, date_seance)
);`}
          </pre>
        </div>
      )}

      {/* SECTION 5: TESTS & VALIDATION */}
      {activeSection === 'tests' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-[#03045E] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0077B6]" />
            Scénarios de Tests Unitaires et Fonctionnels Validés
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="font-bold text-emerald-900 block">Test 1 : Non-chevauchement des enseignants</span>
              <p className="text-emerald-800 mt-1">
                Vérifié : Tentative d'affecter Dr. Randria le Lundi à 08h00 en Amphi B alors qu'il est déjà en Amphi A =&gt; Renvoie Conflit "Enseignant Indisponible" et bloque la persistance.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="font-bold text-emerald-900 block">Test 2 : Non-chevauchement des locaux</span>
              <p className="text-emerald-800 mt-1">
                Vérifié : Deux cours distincts ne peuvent réserver l'Amphi A sur le même créneau horaire =&gt; Détecte collision de salle immédiate et propose des salles alternatives.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="font-bold text-emerald-900 block">Test 3 : Emploi du temps cohérent des étudiants</span>
              <p className="text-emerald-800 mt-1">
                Vérifié : Les étudiants de L1 Informatique ne peuvent avoir deux cours en parallèle =&gt; Détection de double cours immédiate.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="font-bold text-emerald-900 block">Test 4 : Respect des contraintes d'équipement et capacité</span>
              <p className="text-emerald-800 mt-1">
                Vérifié : Alerte levée si un effectif de 110 étudiants est planifié dans une salle de 45 places, ou si un cours de TP Machine n'est pas assigné à une salle informatique.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
