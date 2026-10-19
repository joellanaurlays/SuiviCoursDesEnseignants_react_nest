import { 
  ContraintePlanificationEntity, 
  CreneauHoraireEntity, 
  EmploiDuTempsEntity, 
  EnseignementEntity, 
  SalleEntity, 
  SeancePlanifieeEntity 
} from '../types/schedule';

export const INITIAL_ROOMS: SalleEntity[] = [
  {
    id: 1,
    nom: 'Amphithéâtre A',
    capacite: 180,
    typeSalle: 'AMPHI',
    batiment: 'Bâtiment Principal (RDC)',
    equipements: ['Vidéoprojecteur HD', 'Sonorisation', 'Micro HF', 'Climatisation', 'Accès PMR'],
    estDisponible: true,
    statut: 'ACTIF',
    remarques: 'Réservé en priorité aux cours magistraux de grands effectifs (L1/L2).'
  },
  {
    id: 2,
    nom: 'Amphithéâtre B',
    capacite: 120,
    typeSalle: 'AMPHI',
    batiment: 'Bâtiment Principal (Étage 1)',
    equipements: ['Vidéoprojecteur', 'Sonorisation', 'Tableau blanc'],
    estDisponible: true,
    statut: 'ACTIF',
    remarques: 'Idéal pour promotions L3 et Master.'
  },
  {
    id: 3,
    nom: 'Salle Machine Info 1',
    capacite: 45,
    typeSalle: 'SALLE_TP',
    batiment: 'Pôle Technologique',
    equipements: ['45 PC Core i7', 'Réseau Gigabit', 'Serveur local', 'Vidéoprojecteur', 'Climatisation'],
    estDisponible: true,
    statut: 'ACTIF',
    remarques: 'Travaux Pratiques Programmation & Systèmes.'
  },
  {
    id: 4,
    nom: 'Salle Machine Info 2',
    capacite: 40,
    typeSalle: 'SALLE_TP',
    batiment: 'Pôle Technologique',
    equipements: ['40 PC Linux/Windows', 'Switch manageable', 'Vidéoprojecteur'],
    estDisponible: true,
    statut: 'ACTIF',
    remarques: 'TP Réseaux et Bases de données.'
  },
  {
    id: 5,
    nom: 'Salle TD 101',
    capacite: 50,
    typeSalle: 'SALLE_TD',
    batiment: 'Bâtiment Annexe (RDC)',
    equipements: ['Tableau interactif', 'Vidéoprojecteur mobile', 'Prises 220V aux tables'],
    estDisponible: true,
    statut: 'ACTIF',
    remarques: 'Travaux dirigés et séminaires.'
  },
  {
    id: 6,
    nom: 'Salle TD 102',
    capacite: 45,
    typeSalle: 'SALLE_TD',
    batiment: 'Bâtiment Annexe (Étage)',
    equipements: ['Tableau blanc', 'Écran mural'],
    estDisponible: true,
    statut: 'ACTIF',
    remarques: 'Cours théoriques et exercices.'
  },
  {
    id: 7,
    nom: 'Labo Multimédia & Audio (ICM)',
    capacite: 32,
    typeSalle: 'LABO',
    batiment: 'Pôle Communication & Multimédia',
    equipements: ['30 Stations iMac', 'Cartes son pro', 'Table de mixage', 'Insonorisation', 'Vidéoprojecteur 4K'],
    estDisponible: true,
    statut: 'ACTIF',
    remarques: 'Dédié aux enseignements ICM, montage vidéo et graphisme.'
  },
  {
    id: 8,
    nom: 'Salle de Séminaire M2',
    capacite: 35,
    typeSalle: 'SALLE_TD',
    batiment: 'Bâtiment Recherche & Master',
    equipements: ['Visioconférence Zoom/Teams', 'Écran 75 pouces', 'Micro conférence'],
    estDisponible: false,
    statut: 'MAINTENANCE',
    remarques: 'Travaux de rénovation réseau en cours jusquau 25 Octobre.'
  }
];

export const INITIAL_TIME_SLOTS: CreneauHoraireEntity[] = [
  // Lundi
  { id: 101, jourSemaine: 'Lundi', heureDebut: '08:00', heureFin: '10:00', dureeMinutes: 120, plage: 'Matin', libelle: 'Lundi M1 (08h00 - 10h00)', actif: true },
  { id: 102, jourSemaine: 'Lundi', heureDebut: '10:15', heureFin: '12:15', dureeMinutes: 120, plage: 'Matin', libelle: 'Lundi M2 (10h15 - 12h15)', actif: true },
  { id: 103, jourSemaine: 'Lundi', heureDebut: '13:30', heureFin: '15:30', dureeMinutes: 120, plage: 'Apres-midi', libelle: 'Lundi A1 (13h30 - 15h30)', actif: true },
  { id: 104, jourSemaine: 'Lundi', heureDebut: '15:45', heureFin: '17:45', dureeMinutes: 120, plage: 'Apres-midi', libelle: 'Lundi A2 (15h45 - 17h45)', actif: true },

  // Mardi
  { id: 201, jourSemaine: 'Mardi', heureDebut: '08:00', heureFin: '10:00', dureeMinutes: 120, plage: 'Matin', libelle: 'Mardi M1 (08h00 - 10h00)', actif: true },
  { id: 202, jourSemaine: 'Mardi', heureDebut: '10:15', heureFin: '12:15', dureeMinutes: 120, plage: 'Matin', libelle: 'Mardi M2 (10h15 - 12h15)', actif: true },
  { id: 203, jourSemaine: 'Mardi', heureDebut: '13:30', heureFin: '15:30', dureeMinutes: 120, plage: 'Apres-midi', libelle: 'Mardi A1 (13h30 - 15h30)', actif: true },
  { id: 204, jourSemaine: 'Mardi', heureDebut: '15:45', heureFin: '17:45', dureeMinutes: 120, plage: 'Apres-midi', libelle: 'Mardi A2 (15h45 - 17h45)', actif: true },

  // Mercredi
  { id: 301, jourSemaine: 'Mercredi', heureDebut: '08:00', heureFin: '10:00', dureeMinutes: 120, plage: 'Matin', libelle: 'Mercredi M1 (08h00 - 10h00)', actif: true },
  { id: 302, jourSemaine: 'Mercredi', heureDebut: '10:15', heureFin: '12:15', dureeMinutes: 120, plage: 'Matin', libelle: 'Mercredi M2 (10h15 - 12h15)', actif: true },
  { id: 303, jourSemaine: 'Mercredi', heureDebut: '13:30', heureFin: '15:30', dureeMinutes: 120, plage: 'Apres-midi', libelle: 'Mercredi A1 (13h30 - 15h30)', actif: true },
  { id: 304, jourSemaine: 'Mercredi', heureDebut: '15:45', heureFin: '17:45', dureeMinutes: 120, plage: 'Apres-midi', libelle: 'Mercredi A2 (15h45 - 17h45)', actif: true },

  // Jeudi
  { id: 401, jourSemaine: 'Jeudi', heureDebut: '08:00', heureFin: '10:00', dureeMinutes: 120, plage: 'Matin', libelle: 'Jeudi M1 (08h00 - 10h00)', actif: true },
  { id: 402, jourSemaine: 'Jeudi', heureDebut: '10:15', heureFin: '12:15', dureeMinutes: 120, plage: 'Matin', libelle: 'Jeudi M2 (10h15 - 12h15)', actif: true },
  { id: 403, jourSemaine: 'Jeudi', heureDebut: '13:30', heureFin: '15:30', dureeMinutes: 120, plage: 'Apres-midi', libelle: 'Jeudi A1 (13h30 - 15h30)', actif: true },
  { id: 404, jourSemaine: 'Jeudi', heureDebut: '15:45', heureFin: '17:45', dureeMinutes: 120, plage: 'Apres-midi', libelle: 'Jeudi A2 (15h45 - 17h45)', actif: true },

  // Vendredi
  { id: 501, jourSemaine: 'Vendredi', heureDebut: '08:00', heureFin: '10:00', dureeMinutes: 120, plage: 'Matin', libelle: 'Vendredi M1 (08h00 - 10h00)', actif: true },
  { id: 502, jourSemaine: 'Vendredi', heureDebut: '10:15', heureFin: '12:15', dureeMinutes: 120, plage: 'Matin', libelle: 'Vendredi M2 (10h15 - 12h15)', actif: true },
  { id: 503, jourSemaine: 'Vendredi', heureDebut: '13:30', heureFin: '15:30', dureeMinutes: 120, plage: 'Apres-midi', libelle: 'Vendredi A1 (13h30 - 15h30)', actif: true },
  { id: 504, jourSemaine: 'Vendredi', heureDebut: '15:45', heureFin: '17:45', dureeMinutes: 120, plage: 'Apres-midi', libelle: 'Vendredi A2 (15h45 - 17h45)', actif: true },

  // Samedi (Matin uniquement)
  { id: 601, jourSemaine: 'Samedi', heureDebut: '08:00', heureFin: '10:00', dureeMinutes: 120, plage: 'Matin', libelle: 'Samedi M1 (08h00 - 10h00)', actif: true },
  { id: 602, jourSemaine: 'Samedi', heureDebut: '10:15', heureFin: '12:15', dureeMinutes: 120, plage: 'Matin', libelle: 'Samedi M2 (10h15 - 12h15)', actif: true }
];

export const INITIAL_TEACHINGS: EnseignementEntity[] = [
  {
    id: 301,
    codeMatiere: 'INF101',
    nomMatiere: 'Algorithmique & Structures de Données',
    enseignantId: 12,
    nomEnseignant: 'Dr. Randrianarisoa Mamy',
    enseignantEmail: 'randria.mamy@emit.mg',
    niveauId: 1,
    codeNiveau: 'L1',
    mentionNom: 'Informatique',
    semestreNom: 'S1',
    effectifEtudiants: 110,
    volumeHoraireTotal: 40,
    heuresPlanifiees: 24,
    heuresRealisees: 16,
    typeSalleRequis: 'AMPHI',
    couleurTag: '#0077B6'
  },
  {
    id: 302,
    codeMatiere: 'INF102',
    nomMatiere: 'Architecture des Ordinateurs & Assembleur',
    enseignantId: 14,
    nomEnseignant: 'Mme Razafindrakoto Fanja',
    enseignantEmail: 'razafy.fanja@emit.mg',
    niveauId: 1,
    codeNiveau: 'L1',
    mentionNom: 'Informatique',
    semestreNom: 'S1',
    effectifEtudiants: 110,
    volumeHoraireTotal: 30,
    heuresPlanifiees: 18,
    heuresRealisees: 12,
    typeSalleRequis: 'AMPHI',
    couleurTag: '#00B4D8'
  },
  {
    id: 303,
    codeMatiere: 'INF201',
    nomMatiere: 'Bases de Données Relationnelles & SQL',
    enseignantId: 15,
    nomEnseignant: 'Pr. Rakotondrabe Jean',
    enseignantEmail: 'rakoto.jean@emit.mg',
    niveauId: 2,
    codeNiveau: 'L2',
    mentionNom: 'Informatique',
    semestreNom: 'S3',
    effectifEtudiants: 85,
    volumeHoraireTotal: 35,
    heuresPlanifiees: 20,
    heuresRealisees: 14,
    typeSalleRequis: 'AMPHI',
    couleurTag: '#03045E'
  },
  {
    id: 304,
    codeMatiere: 'INF202',
    nomMatiere: 'TP Administration Systèmes Linux',
    enseignantId: 14,
    nomEnseignant: 'Mme Razafindrakoto Fanja',
    enseignantEmail: 'razafy.fanja@emit.mg',
    niveauId: 2,
    codeNiveau: 'L2',
    mentionNom: 'Informatique',
    semestreNom: 'S3',
    effectifEtudiants: 40,
    volumeHoraireTotal: 30,
    heuresPlanifiees: 16,
    heuresRealisees: 10,
    typeSalleRequis: 'SALLE_TP',
    couleurTag: '#0284c7'
  },
  {
    id: 305,
    codeMatiere: 'INF301',
    nomMatiere: 'Génie Logiciel & Architecture Microservices',
    enseignantId: 12,
    nomEnseignant: 'Dr. Randrianarisoa Mamy',
    enseignantEmail: 'randria.mamy@emit.mg',
    niveauId: 3,
    codeNiveau: 'L3',
    mentionNom: 'Informatique',
    semestreNom: 'S5',
    effectifEtudiants: 55,
    volumeHoraireTotal: 35,
    heuresPlanifiees: 22,
    heuresRealisees: 18,
    typeSalleRequis: 'AMPHI',
    couleurTag: '#0369a1'
  },
  {
    id: 306,
    codeMatiere: 'MGT101',
    nomMatiere: 'Principes de Gestion & Comptabilité Générale',
    enseignantId: 16,
    nomEnseignant: 'M. Ravelomanana Hery',
    enseignantEmail: 'ravelo.hery@emit.mg',
    niveauId: 4,
    codeNiveau: 'L1',
    mentionNom: 'Management',
    semestreNom: 'S1',
    effectifEtudiants: 95,
    volumeHoraireTotal: 36,
    heuresPlanifiees: 20,
    heuresRealisees: 12,
    typeSalleRequis: 'AMPHI',
    couleurTag: '#0d9488'
  },
  {
    id: 307,
    codeMatiere: 'ICM101',
    nomMatiere: 'Design Graphique, Typographie & UX',
    enseignantId: 18,
    nomEnseignant: 'Mme Andriambelo Sarah',
    enseignantEmail: 'andriambelo.sarah@emit.mg',
    niveauId: 5,
    codeNiveau: 'L1',
    mentionNom: 'ICM',
    semestreNom: 'S1',
    effectifEtudiants: 30,
    volumeHoraireTotal: 30,
    heuresPlanifiees: 16,
    heuresRealisees: 8,
    typeSalleRequis: 'LABO',
    couleurTag: '#6366f1'
  },
  {
    id: 308,
    codeMatiere: 'INF501',
    nomMatiere: 'Intelligence Artificielle & Deep Learning',
    enseignantId: 19,
    nomEnseignant: 'Dr. Andriamampianina Tsiry',
    enseignantEmail: 'tsiry.andria@emit.mg',
    niveauId: 6,
    codeNiveau: 'M1',
    mentionNom: 'Informatique',
    semestreNom: 'S7',
    effectifEtudiants: 30,
    volumeHoraireTotal: 35,
    heuresPlanifiees: 14,
    heuresRealisees: 8,
    typeSalleRequis: 'SALLE_TP',
    couleurTag: '#8b5cf6'
  }
];

export const INITIAL_SCHEDULE_METADATA: EmploiDuTempsEntity = {
  id: 1,
  titre: 'Emploi du Temps Officiel — Semestre Impair (S1 / S3 / S5 / S7)',
  semestreNom: 'Semestre 1',
  mentionNom: 'Toutes',
  anneeUniversitaire: '2026 - 2027',
  semaineDu: '2026-10-19',
  dateMiseAJour: '2026-10-18 19:40',
  estValide: true,
  estPublie: true,
  version: 3
};

export const INITIAL_SESSIONS: SeancePlanifieeEntity[] = [
  // Lundi 08:00 - 10:00 (Cas réel du diagramme d'objet 2.4 du PDF!)
  {
    id: 9001,
    emploiDuTempsId: 1,
    enseignementId: 301,
    codeMatiere: 'INF101',
    matiereNom: 'Algorithmique & Structures de Données',
    typeSeance: 'CM',
    enseignantId: 12,
    nomEnseignant: 'Dr. Randrianarisoa Mamy',
    niveauId: 1,
    codeNiveau: 'L1',
    mentionNom: 'Informatique',
    semestreNom: 'S1',
    salleId: 1, // Amphi A (180 places)
    nomSalle: 'Amphithéâtre A',
    creneauId: 101,
    jourSemaine: 'Lundi',
    heureDebut: '08:00',
    heureFin: '10:00',
    dateSeance: '2026-10-19',
    statut: 'PLANIFIE',
    notes: 'Séance inaugurale : Récursivité et Complexité'
  },
  // Lundi 10:15 - 12:15
  {
    id: 9002,
    emploiDuTempsId: 1,
    enseignementId: 302,
    codeMatiere: 'INF102',
    matiereNom: 'Architecture des Ordinateurs & Assembleur',
    typeSeance: 'CM',
    enseignantId: 14,
    nomEnseignant: 'Mme Razafindrakoto Fanja',
    niveauId: 1,
    codeNiveau: 'L1',
    mentionNom: 'Informatique',
    semestreNom: 'S1',
    salleId: 1,
    nomSalle: 'Amphithéâtre A',
    creneauId: 102,
    jourSemaine: 'Lundi',
    heureDebut: '10:15',
    heureFin: '12:15',
    dateSeance: '2026-10-19',
    statut: 'PLANIFIE'
  },
  // Lundi 08:00 - 10:00 (MGT101 en Amphi B)
  {
    id: 9003,
    emploiDuTempsId: 1,
    enseignementId: 306,
    codeMatiere: 'MGT101',
    matiereNom: 'Principes de Gestion & Comptabilité Générale',
    typeSeance: 'CM',
    enseignantId: 16,
    nomEnseignant: 'M. Ravelomanana Hery',
    niveauId: 4,
    codeNiveau: 'L1',
    mentionNom: 'Management',
    semestreNom: 'S1',
    salleId: 2,
    nomSalle: 'Amphithéâtre B',
    creneauId: 101,
    jourSemaine: 'Lundi',
    heureDebut: '08:00',
    heureFin: '10:00',
    dateSeance: '2026-10-19',
    statut: 'PLANIFIE'
  },
  // Lundi 13:30 - 15:30 (ICM101 en Labo Multimédia)
  {
    id: 9004,
    emploiDuTempsId: 1,
    enseignementId: 307,
    codeMatiere: 'ICM101',
    matiereNom: 'Design Graphique, Typographie & UX',
    typeSeance: 'TP',
    enseignantId: 18,
    nomEnseignant: 'Mme Andriambelo Sarah',
    niveauId: 5,
    codeNiveau: 'L1',
    mentionNom: 'ICM',
    semestreNom: 'S1',
    salleId: 7,
    nomSalle: 'Labo Multimédia & Audio (ICM)',
    creneauId: 103,
    jourSemaine: 'Lundi',
    heureDebut: '13:30',
    heureFin: '15:30',
    dateSeance: '2026-10-19',
    statut: 'PLANIFIE'
  },

  // Mardi 08:00 - 10:00 (INF201 L2 Info en Amphi B)
  {
    id: 9005,
    emploiDuTempsId: 1,
    enseignementId: 303,
    codeMatiere: 'INF201',
    matiereNom: 'Bases de Données Relationnelles & SQL',
    typeSeance: 'CM',
    enseignantId: 15,
    nomEnseignant: 'Pr. Rakotondrabe Jean',
    niveauId: 2,
    codeNiveau: 'L2',
    mentionNom: 'Informatique',
    semestreNom: 'S3',
    salleId: 2,
    nomSalle: 'Amphithéâtre B',
    creneauId: 201,
    jourSemaine: 'Mardi',
    heureDebut: '08:00',
    heureFin: '10:00',
    dateSeance: '2026-10-20',
    statut: 'PLANIFIE'
  },
  // Mardi 10:15 - 12:15 (INF202 TP Linux en Salle Info 1)
  {
    id: 9006,
    emploiDuTempsId: 1,
    enseignementId: 304,
    codeMatiere: 'INF202',
    matiereNom: 'TP Administration Systèmes Linux',
    typeSeance: 'TP',
    enseignantId: 14,
    nomEnseignant: 'Mme Razafindrakoto Fanja',
    niveauId: 2,
    codeNiveau: 'L2',
    mentionNom: 'Informatique',
    semestreNom: 'S3',
    salleId: 3,
    nomSalle: 'Salle Machine Info 1',
    creneauId: 202,
    jourSemaine: 'Mardi',
    heureDebut: '10:15',
    heureFin: '12:15',
    dateSeance: '2026-10-20',
    statut: 'PLANIFIE'
  },

  // Mercredi 08:00 - 10:00 (INF301 L3 Info en Amphi B)
  {
    id: 9007,
    emploiDuTempsId: 1,
    enseignementId: 305,
    codeMatiere: 'INF301',
    matiereNom: 'Génie Logiciel & Architecture Microservices',
    typeSeance: 'CM',
    enseignantId: 12,
    nomEnseignant: 'Dr. Randrianarisoa Mamy',
    niveauId: 3,
    codeNiveau: 'L3',
    mentionNom: 'Informatique',
    semestreNom: 'S5',
    salleId: 2,
    nomSalle: 'Amphithéâtre B',
    creneauId: 301,
    jourSemaine: 'Mercredi',
    heureDebut: '08:00',
    heureFin: '10:00',
    dateSeance: '2026-10-21',
    statut: 'PLANIFIE'
  },
  // Mercredi 13:30 - 15:30 (M1 Info en Salle Info 1)
  {
    id: 9008,
    emploiDuTempsId: 1,
    enseignementId: 308,
    codeMatiere: 'INF501',
    matiereNom: 'Intelligence Artificielle & Deep Learning',
    typeSeance: 'TP',
    enseignantId: 19,
    nomEnseignant: 'Dr. Andriamampianina Tsiry',
    niveauId: 6,
    codeNiveau: 'M1',
    mentionNom: 'Informatique',
    semestreNom: 'S7',
    salleId: 3,
    nomSalle: 'Salle Machine Info 1',
    creneauId: 303,
    jourSemaine: 'Mercredi',
    heureDebut: '13:30',
    heureFin: '15:30',
    dateSeance: '2026-10-21',
    statut: 'PLANIFIE'
  },

  // Jeudi 08:00 - 10:00 (Séance Brouillon pour validation)
  {
    id: 9009,
    emploiDuTempsId: 1,
    enseignementId: 301,
    codeMatiere: 'INF101',
    matiereNom: 'Algorithmique & Structures de Données',
    typeSeance: 'TD',
    enseignantId: 12,
    nomEnseignant: 'Dr. Randrianarisoa Mamy',
    niveauId: 1,
    codeNiveau: 'L1',
    mentionNom: 'Informatique',
    semestreNom: 'S1',
    salleId: 5,
    nomSalle: 'Salle TD 101',
    creneauId: 401,
    jourSemaine: 'Jeudi',
    heureDebut: '08:00',
    heureFin: '10:00',
    dateSeance: '2026-10-22',
    statut: 'BROUILLON',
    notes: 'À faire valider par le chef de département'
  }
];

export const INITIAL_CONSTRAINTS: ContraintePlanificationEntity[] = [
  {
    id: 1,
    titre: 'Indisponibilité Hebdomadaire Pr. Rakotondrabe',
    typeContrainte: 'ENSEIGNANT',
    niveauPriorite: 'BLOQUANTE',
    cibleId: 15,
    cibleNom: 'Pr. Rakotondrabe Jean',
    description: 'En mission de recherche universitaire les vendredis après-midi.',
    regle: {
      jourSemaine: 'Vendredi',
      creneauId: 503
    },
    active: true
  },
  {
    id: 2,
    titre: 'Exigence Matériel TP Réseau & Machines',
    typeContrainte: 'SALLE',
    niveauPriorite: 'BLOQUANTE',
    cibleNom: 'Séances TP Informatique',
    description: 'Les séances de TP doivent obligatoirement être affectées à une Salle TP ou Labo avec ordinateurs individuels.',
    regle: {
      typeSalleExige: 'SALLE_TP'
    },
    active: true
  },
  {
    id: 3,
    titre: 'Plafond Horaire Étudiants L1 (Maximum 6h / jour)',
    typeContrainte: 'NIVEAU',
    niveauPriorite: 'PREFERENTIELLE',
    cibleNom: 'Licence 1 (Toutes Mentions)',
    description: 'Éviter de surcharger les étudiants de première année au-delà de 3 blocs de 2h par jour pour favoriser le travail personnel.',
    regle: {
      maxHeuresJour: 6
    },
    active: true
  },
  {
    id: 4,
    titre: 'Préservation Pause Méridienne (12h15 - 13h30)',
    typeContrainte: 'GLOBAL',
    niveauPriorite: 'BLOQUANTE',
    cibleNom: 'Tous Niveaux & Enseignants',
    description: 'Aucun cours ne peut être programmé entre 12h15 et 13h30 pour la pause déjeuner et le repos du personnel.',
    regle: {
      plageInterdite: '12:15-13:30'
    },
    active: true
  }
];
