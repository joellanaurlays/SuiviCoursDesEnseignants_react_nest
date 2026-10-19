import { SalleEntity } from '../entities/salle.entity';
import { CreneauHoraireEntity } from '../entities/creneau-horaire.entity';
import { SeancePlanifieeEntity } from '../entities/seance-planifiee.entity';
import { EmploiDuTempsEntity } from '../entities/emploi-du-temps.entity';
import { ContraintePlanificationEntity } from '../entities/contrainte-planification.entity';

export interface EnseignementReference {
  id: number;
  codeMatiere: string;
  nomMatiere: string;
  enseignantId: number;
  nomEnseignant: string;
  niveauId: number;
  codeNiveau: string;
  mentionNom: string;
  semestreNom: string;
  effectifEtudiants: number;
  volumeHoraireTotal: number;
  heuresPlanifiees: number;
  heuresRealisees: number;
  typeSalleRequis: 'AMPHI' | 'SALLE_TP' | 'SALLE_TD' | 'LABO';
}

/**
 * DataStore Singleton servant de référentiel persistant en mémoire
 * pour le backend NestJS/Express.
 */
export class DataStore {
  private static instance: DataStore;

  public rooms: SalleEntity[] = [];
  public timeSlots: CreneauHoraireEntity[] = [];
  public sessions: SeancePlanifieeEntity[] = [];
  public scheduleMeta!: EmploiDuTempsEntity;
  public constraints: ContraintePlanificationEntity[] = [];
  public teachings: EnseignementReference[] = [];

  private constructor() {
    this.seed();
  }

  public static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore();
    }
    return DataStore.instance;
  }

  private seed(): void {
    // 1. Initial Rooms
    this.rooms = [
      new SalleEntity({
        id: 1,
        nom: 'Amphithéâtre A',
        capacite: 180,
        typeSalle: 'AMPHI',
        batiment: 'Bâtiment Principal (RDC)',
        equipements: ['Vidéoprojecteur HD', 'Sonorisation', 'Micro HF', 'Climatisation', 'Accès PMR'],
        estDisponible: true,
        statut: 'ACTIF',
        remarques: 'Réservé en priorité aux cours magistraux de grands effectifs (L1/L2).'
      }),
      new SalleEntity({
        id: 2,
        nom: 'Amphithéâtre B',
        capacite: 120,
        typeSalle: 'AMPHI',
        batiment: 'Bâtiment Principal (Étage 1)',
        equipements: ['Vidéoprojecteur', 'Sonorisation', 'Tableau blanc'],
        estDisponible: true,
        statut: 'ACTIF',
        remarques: 'Idéal pour promotions L3 et Master.'
      }),
      new SalleEntity({
        id: 3,
        nom: 'Salle Machine Info 1',
        capacite: 45,
        typeSalle: 'SALLE_TP',
        batiment: 'Pôle Technologique',
        equipements: ['45 PC Core i7', 'Réseau Gigabit', 'Serveur local', 'Vidéoprojecteur', 'Climatisation'],
        estDisponible: true,
        statut: 'ACTIF',
        remarques: 'Travaux Pratiques Programmation & Systèmes.'
      }),
      new SalleEntity({
        id: 4,
        nom: 'Salle Machine Info 2',
        capacite: 40,
        typeSalle: 'SALLE_TP',
        batiment: 'Pôle Technologique',
        equipements: ['40 PC Linux/Windows', 'Switch manageable', 'Vidéoprojecteur'],
        estDisponible: true,
        statut: 'ACTIF',
        remarques: 'TP Réseaux et Bases de données.'
      }),
      new SalleEntity({
        id: 5,
        nom: 'Salle TD 101',
        capacite: 50,
        typeSalle: 'SALLE_TD',
        batiment: 'Bâtiment Annexe (RDC)',
        equipements: ['Tableau interactif', 'Vidéoprojecteur mobile', 'Prises 220V aux tables'],
        estDisponible: true,
        statut: 'ACTIF',
        remarques: 'Travaux dirigés et séminaires.'
      }),
      new SalleEntity({
        id: 6,
        nom: 'Salle TD 102',
        capacite: 45,
        typeSalle: 'SALLE_TD',
        batiment: 'Bâtiment Annexe (Étage)',
        equipements: ['Tableau blanc', 'Écran mural'],
        estDisponible: true,
        statut: 'ACTIF',
        remarques: 'Cours théoriques et exercices.'
      }),
      new SalleEntity({
        id: 7,
        nom: 'Labo Multimédia & Audio (ICM)',
        capacite: 32,
        typeSalle: 'LABO',
        batiment: 'Pôle Communication & Multimédia',
        equipements: ['30 Stations iMac', 'Cartes son pro', 'Table de mixage', 'Insonorisation', 'Vidéoprojecteur 4K'],
        estDisponible: true,
        statut: 'ACTIF',
        remarques: 'Dédié aux enseignements ICM, montage vidéo et graphisme.'
      }),
      new SalleEntity({
        id: 8,
        nom: 'Salle de Séminaire M2',
        capacite: 35,
        typeSalle: 'SALLE_TD',
        batiment: 'Bâtiment Recherche & Master',
        equipements: ['Visioconférence Zoom/Teams', 'Écran 75 pouces'],
        estDisponible: false,
        statut: 'MAINTENANCE',
        remarques: 'Maintenance réseau en cours.'
      })
    ];

    // 2. Initial TimeSlots
    this.timeSlots = [
      new CreneauHoraireEntity({ id: 101, jourSemaine: 'Lundi', heureDebut: '08:00', heureFin: '10:00', dureeMinutes: 120, plage: 'Matin', libelle: 'Lundi M1', actif: true }),
      new CreneauHoraireEntity({ id: 102, jourSemaine: 'Lundi', heureDebut: '10:15', heureFin: '12:15', dureeMinutes: 120, plage: 'Matin', libelle: 'Lundi M2', actif: true }),
      new CreneauHoraireEntity({ id: 103, jourSemaine: 'Lundi', heureDebut: '13:30', heureFin: '15:30', dureeMinutes: 120, plage: 'Apres-midi', libelle: 'Lundi A1', actif: true }),
      new CreneauHoraireEntity({ id: 104, jourSemaine: 'Lundi', heureDebut: '15:45', heureFin: '17:45', dureeMinutes: 120, plage: 'Apres-midi', libelle: 'Lundi A2', actif: true }),

      new CreneauHoraireEntity({ id: 201, jourSemaine: 'Mardi', heureDebut: '08:00', heureFin: '10:00', dureeMinutes: 120, plage: 'Matin', libelle: 'Mardi M1', actif: true }),
      new CreneauHoraireEntity({ id: 202, jourSemaine: 'Mardi', heureDebut: '10:15', heureFin: '12:15', dureeMinutes: 120, plage: 'Matin', libelle: 'Mardi M2', actif: true }),
      new CreneauHoraireEntity({ id: 203, jourSemaine: 'Mardi', heureDebut: '13:30', heureFin: '15:30', dureeMinutes: 120, plage: 'Apres-midi', libelle: 'Mardi A1', actif: true }),
      new CreneauHoraireEntity({ id: 204, jourSemaine: 'Mardi', heureDebut: '15:45', heureFin: '17:45', dureeMinutes: 120, plage: 'Apres-midi', libelle: 'Mardi A2', actif: true }),

      new CreneauHoraireEntity({ id: 301, jourSemaine: 'Mercredi', heureDebut: '08:00', heureFin: '10:00', dureeMinutes: 120, plage: 'Matin', libelle: 'Mercredi M1', actif: true }),
      new CreneauHoraireEntity({ id: 302, jourSemaine: 'Mercredi', heureDebut: '10:15', heureFin: '12:15', dureeMinutes: 120, plage: 'Matin', libelle: 'Mercredi M2', actif: true }),
      new CreneauHoraireEntity({ id: 303, jourSemaine: 'Mercredi', heureDebut: '13:30', heureFin: '15:30', dureeMinutes: 120, plage: 'Apres-midi', libelle: 'Mercredi A1', actif: true }),
      new CreneauHoraireEntity({ id: 304, jourSemaine: 'Mercredi', heureDebut: '15:45', heureFin: '17:45', dureeMinutes: 120, plage: 'Apres-midi', libelle: 'Mercredi A2', actif: true }),

      new CreneauHoraireEntity({ id: 401, jourSemaine: 'Jeudi', heureDebut: '08:00', heureFin: '10:00', dureeMinutes: 120, plage: 'Matin', libelle: 'Jeudi M1', actif: true }),
      new CreneauHoraireEntity({ id: 402, jourSemaine: 'Jeudi', heureDebut: '10:15', heureFin: '12:15', dureeMinutes: 120, plage: 'Matin', libelle: 'Jeudi M2', actif: true }),
      new CreneauHoraireEntity({ id: 403, jourSemaine: 'Jeudi', heureDebut: '13:30', heureFin: '15:30', dureeMinutes: 120, plage: 'Apres-midi', libelle: 'Jeudi A1', actif: true }),
      new CreneauHoraireEntity({ id: 404, jourSemaine: 'Jeudi', heureDebut: '15:45', heureFin: '17:45', dureeMinutes: 120, plage: 'Apres-midi', libelle: 'Jeudi A2', actif: true }),

      new CreneauHoraireEntity({ id: 501, jourSemaine: 'Vendredi', heureDebut: '08:00', heureFin: '10:00', dureeMinutes: 120, plage: 'Matin', libelle: 'Vendredi M1', actif: true }),
      new CreneauHoraireEntity({ id: 502, jourSemaine: 'Vendredi', heureDebut: '10:15', heureFin: '12:15', dureeMinutes: 120, plage: 'Matin', libelle: 'Vendredi M2', actif: true }),
      new CreneauHoraireEntity({ id: 503, jourSemaine: 'Vendredi', heureDebut: '13:30', heureFin: '15:30', dureeMinutes: 120, plage: 'Apres-midi', libelle: 'Vendredi A1', actif: true }),
      new CreneauHoraireEntity({ id: 504, jourSemaine: 'Vendredi', heureDebut: '15:45', heureFin: '17:45', dureeMinutes: 120, plage: 'Apres-midi', libelle: 'Vendredi A2', actif: true }),

      new CreneauHoraireEntity({ id: 601, jourSemaine: 'Samedi', heureDebut: '08:00', heureFin: '10:00', dureeMinutes: 120, plage: 'Matin', libelle: 'Samedi M1', actif: true }),
      new CreneauHoraireEntity({ id: 602, jourSemaine: 'Samedi', heureDebut: '10:15', heureFin: '12:15', dureeMinutes: 120, plage: 'Matin', libelle: 'Samedi M2', actif: true })
    ];

    // 3. Schedule Metadata
    this.scheduleMeta = new EmploiDuTempsEntity({
      id: 1,
      titre: 'Emploi du Temps Officiel — Semestre 1 (S1 / S3 / S5 / S7)',
      semestreNom: 'Semestre 1',
      mentionNom: 'Toutes',
      anneeUniversitaire: '2026 - 2027',
      semaineDu: '2026-10-19',
      dateMiseAJour: '2026-10-19 08:30',
      estValide: true,
      estPublie: true,
      version: 1
    });

    // 4. Initial Teachings
    this.teachings = [
      { id: 301, codeMatiere: 'INF101', nomMatiere: 'Algorithmique & Structures de Données', enseignantId: 12, nomEnseignant: 'Dr. Randrianarisoa Mamy', niveauId: 1, codeNiveau: 'L1', mentionNom: 'Informatique', semestreNom: 'S1', effectifEtudiants: 110, volumeHoraireTotal: 40, heuresPlanifiees: 24, heuresRealisees: 16, typeSalleRequis: 'AMPHI' },
      { id: 302, codeMatiere: 'INF102', nomMatiere: 'Architecture des Ordinateurs & Assembleur', enseignantId: 14, nomEnseignant: 'Mme Razafindrakoto Fanja', niveauId: 1, codeNiveau: 'L1', mentionNom: 'Informatique', semestreNom: 'S1', effectifEtudiants: 110, volumeHoraireTotal: 30, heuresPlanifiees: 18, heuresRealisees: 12, typeSalleRequis: 'AMPHI' },
      { id: 303, codeMatiere: 'INF201', nomMatiere: 'Bases de Données Relationnelles & SQL', enseignantId: 15, nomEnseignant: 'Pr. Rakotondrabe Jean', niveauId: 2, codeNiveau: 'L2', mentionNom: 'Informatique', semestreNom: 'S3', effectifEtudiants: 85, volumeHoraireTotal: 35, heuresPlanifiees: 20, heuresRealisees: 14, typeSalleRequis: 'AMPHI' },
      { id: 304, codeMatiere: 'INF202', nomMatiere: 'TP Administration Systèmes Linux', enseignantId: 14, nomEnseignant: 'Mme Razafindrakoto Fanja', niveauId: 2, codeNiveau: 'L2', mentionNom: 'Informatique', semestreNom: 'S3', effectifEtudiants: 40, volumeHoraireTotal: 30, heuresPlanifiees: 16, heuresRealisees: 10, typeSalleRequis: 'SALLE_TP' },
      { id: 305, codeMatiere: 'INF301', nomMatiere: 'Génie Logiciel & Architecture Microservices', enseignantId: 12, nomEnseignant: 'Dr. Randrianarisoa Mamy', niveauId: 3, codeNiveau: 'L3', mentionNom: 'Informatique', semestreNom: 'S5', effectifEtudiants: 55, volumeHoraireTotal: 35, heuresPlanifiees: 22, heuresRealisees: 18, typeSalleRequis: 'AMPHI' },
      { id: 306, codeMatiere: 'MGT101', nomMatiere: 'Principes de Gestion & Comptabilité Générale', enseignantId: 16, nomEnseignant: 'M. Ravelomanana Hery', niveauId: 4, codeNiveau: 'L1', mentionNom: 'Management', semestreNom: 'S1', effectifEtudiants: 95, volumeHoraireTotal: 36, heuresPlanifiees: 20, heuresRealisees: 12, typeSalleRequis: 'AMPHI' },
      { id: 307, codeMatiere: 'ICM101', nomMatiere: 'Design Graphique, Typographie & UX', enseignantId: 18, nomEnseignant: 'Mme Andriambelo Sarah', niveauId: 5, codeNiveau: 'L1', mentionNom: 'ICM', semestreNom: 'S1', effectifEtudiants: 30, volumeHoraireTotal: 30, heuresPlanifiees: 16, heuresRealisees: 8, typeSalleRequis: 'LABO' },
      { id: 308, codeMatiere: 'INF501', nomMatiere: 'Intelligence Artificielle & Deep Learning', enseignantId: 19, nomEnseignant: 'Dr. Andriamampianina Tsiry', niveauId: 6, codeNiveau: 'M1', mentionNom: 'Informatique', semestreNom: 'S7', effectifEtudiants: 30, volumeHoraireTotal: 35, heuresPlanifiees: 14, heuresRealisees: 8, typeSalleRequis: 'SALLE_TP' }
    ];

    // 5. Initial Sessions
    this.sessions = [
      new SeancePlanifieeEntity({
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
        salleId: 1,
        nomSalle: 'Amphithéâtre A',
        creneauId: 101,
        jourSemaine: 'Lundi',
        heureDebut: '08:00',
        heureFin: '10:00',
        dateSeance: '2026-10-19',
        statut: 'PLANIFIE',
        notes: 'Séance inaugurale : Récursivité et Complexité'
      }),
      new SeancePlanifieeEntity({
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
      }),
      new SeancePlanifieeEntity({
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
      }),
      new SeancePlanifieeEntity({
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
      }),
      new SeancePlanifieeEntity({
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
      }),
      new SeancePlanifieeEntity({
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
      })
    ];

    // 6. Constraints
    this.constraints = [
      new ContraintePlanificationEntity({
        id: 1,
        titre: 'Indisponibilité Hebdomadaire Pr. Rakotondrabe',
        typeContrainte: 'ENSEIGNANT',
        niveauPriorite: 'BLOQUANTE',
        cibleId: 15,
        cibleNom: 'Pr. Rakotondrabe Jean',
        description: 'En mission de recherche universitaire les vendredis après-midi.',
        regle: { jourSemaine: 'Vendredi', creneauId: 503 },
        active: true
      }),
      new ContraintePlanificationEntity({
        id: 2,
        titre: 'Exigence Matériel TP Réseau & Machines',
        typeContrainte: 'SALLE',
        niveauPriorite: 'BLOQUANTE',
        cibleNom: 'Séances TP Informatique',
        description: 'Les séances de TP doivent obligatoirement être affectées à une Salle TP ou Labo avec ordinateurs.',
        regle: { typeSalleExige: 'SALLE_TP' },
        active: true
      }),
      new ContraintePlanificationEntity({
        id: 3,
        titre: 'Plafond Horaire Étudiants L1 (Maximum 6h / jour)',
        typeContrainte: 'NIVEAU',
        niveauPriorite: 'PREFERENTIELLE',
        cibleNom: 'Licence 1 (Toutes Mentions)',
        description: 'Éviter de surcharger les étudiants de première année au-delà de 3 blocs de 2h par jour.',
        regle: { maxHeuresJour: 6 },
        active: true
      })
    ];
  }
}
