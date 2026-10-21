/**
 * Modélisation de l'entité EmploiDuTemps (TypeORM / PostgreSQL)
 * Table: 'emploi_du_temps'
 * Regroupe les séances d'un semestre et gère le statut global de publication.
 */
export class EmploiDuTempsEntity {
  id!: number;
  titre!: string;
  semestreNom!: string;
  mentionNom!: string;
  anneeUniversitaire!: string;
  semaineDu!: string; // Date début semaine
  dateMiseAJour!: string;
  estValide!: boolean;
  estPublie!: boolean;
  version!: number;

  constructor(partial?: Partial<EmploiDuTempsEntity>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  publish(): void {
    this.estPublie = true;
    this.estValide = true;
    this.version += 1;
    this.dateMiseAJour = new Date().toISOString().replace('T', ' ').substring(0, 16);
  }
}
