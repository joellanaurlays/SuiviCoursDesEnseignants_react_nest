import { Logger } from '@nestjs/common';
import { CreneauHoraireEntity, DayOfWeek, TimeSlotPeriod } from '../entities/creneau-horaire.entity.js';
import { ContraintePlanificationEntity } from '../entities/contrainte-planification.entity.js';
import { SalleEntity } from '../entities/salle.entity.js';
import { DataStore } from './data-store.js';

const DAYS: DayOfWeek[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const SLOT_TEMPLATE: Array<{ heureDebut: string; heureFin: string; plage: TimeSlotPeriod }> = [
  { heureDebut: '08:00', heureFin: '10:00', plage: 'Matin' },
  { heureDebut: '10:15', heureFin: '12:15', plage: 'Matin' },
  { heureDebut: '13:00', heureFin: '15:00', plage: 'Apres-midi' },
  { heureDebut: '15:15', heureFin: '17:15', plage: 'Apres-midi' },
];

function buildDemoRooms(): SalleEntity[] {
  const rooms: Array<Partial<SalleEntity>> = [
    { nom: 'Amphi A', capacite: 120, typeSalle: 'AMPHI', batiment: 'Bâtiment principal', equipements: ['vidéoprojecteur', 'micro'] },
    { nom: 'Amphi B', capacite: 80, typeSalle: 'AMPHI', batiment: 'Bâtiment principal', equipements: ['vidéoprojecteur'] },
    { nom: 'Salle TD1', capacite: 40, typeSalle: 'SALLE_TD', batiment: 'Bâtiment principal', equipements: ['tableau blanc'] },
    { nom: 'Salle TD2', capacite: 40, typeSalle: 'SALLE_TD', batiment: 'Annexe', equipements: ['tableau blanc'] },
    { nom: 'Labo Informatique', capacite: 24, typeSalle: 'LABO', batiment: 'Annexe', equipements: ['postes informatique', 'connexion internet'] },
    { nom: 'Salle TP Sciences', capacite: 30, typeSalle: 'SALLE_TP', batiment: 'Bâtiment scientifique', equipements: ['paillasse', 'tableau'] },
  ];
  return rooms.map((room, index) => new SalleEntity({
    id: index + 1,
    estDisponible: true,
    statut: 'ACTIF',
    ...room,
  } as SalleEntity));
}

function buildDemoTimeSlots(): CreneauHoraireEntity[] {
  const slots: CreneauHoraireEntity[] = [];
  let id = 1;
  for (const day of DAYS) {
    const perPlageCount: Record<string, number> = {};
    for (const { heureDebut, heureFin, plage } of SLOT_TEMPLATE) {
      perPlageCount[plage] = (perPlageCount[plage] ?? 0) + 1;
      slots.push(new CreneauHoraireEntity({
        id,
        jourSemaine: day,
        heureDebut,
        heureFin,
        dureeMinutes: 120,
        plage,
        libelle: `${day} ${plage} ${perPlageCount[plage]}`,
        actif: true,
      }));
      id += 1;
    }
  }
  return slots;
}

function buildDemoConstraints(): ContraintePlanificationEntity[] {
  return [
    new ContraintePlanificationEntity({
      id: 1,
      titre: 'TP en salle dédiée uniquement',
      typeContrainte: 'SALLE',
      niveauPriorite: 'BLOQUANTE',
      cibleId: 6,
      cibleNom: 'Salle TP Sciences',
      description: 'Les séances de TP doivent se dérouler en SALLE_TP ou LABO.',
      regle: { typeSalleExige: 'SALLE_TP' },
      active: true,
    }),
    new ContraintePlanificationEntity({
      id: 2,
      titre: 'Pas de cours le samedi après-midi',
      typeContrainte: 'GLOBAL',
      niveauPriorite: 'PREFERENTIELLE',
      cibleNom: 'Emploi du temps',
      description: 'Éviter les créneaux du samedi après-midi.',
      regle: { jourSemaine: 'Samedi', plageInterdite: 'Apres-midi' },
      active: true,
    }),
  ];
}

/**
 * Initialisation du module emploi du temps (Membre 5) :
 * applique schema.sql, importe les tables existantes puis insère un jeu de
 * démonstration (salles, créneaux, contraintes) si la base est vide.
 * Idempotent : DataStore.save() upserte par id et le seed ne s'exécute que
 * si aucune salle/créneau n'a encore été enregistré.
 */
export async function bootstrapPlanningDataStore(): Promise<void> {
  const logger = new Logger('PlanningBootstrap');
  const store = DataStore.getInstance();
  await store.initialize();
  if (store.rooms.length === 0 && store.timeSlots.length === 0) {
    store.rooms = buildDemoRooms();
    store.timeSlots = buildDemoTimeSlots();
    store.constraints = buildDemoConstraints();
    await store.save();
    logger.log(`Données de démonstration planning insérées (${store.rooms.length} salles, ${store.timeSlots.length} créneaux).`);
  }
}
