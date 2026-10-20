import { IsDateString, IsOptional, IsString, Matches } from 'class-validator';

/**
 * Réalisation d'une séance planifiée.
 *
 * L'enseignant responsable confirme les informations réellement observées :
 * date effective, horaires, contenu enseigné, salle et type de séance.
 *
 * La salle et le type de séance sont OBLIGATOIRES pour marquer une séance
 * comme réalisée (message explicite en cas d'absence). Les autres champs
 * restent optionnels : s'ils sont absents, les valeurs déjà enregistrées sur
 * la séance sont conservées. La durée est TOUJOURS recalculée côté serveur à
 * partir des horaires, jamais fournie par le client.
 */
export class RealiserSeanceDto {
  @IsDateString({ strict: false })
  @IsOptional()
  dateSeance?: string;

  @IsString()
  @Matches(/^([01]?\d|2[0-3]):[0-5]\d$/, {
    message: 'heureDebut doit respecter le format HH:mm',
  })
  @IsOptional()
  heureDebut?: string;

  @IsString()
  @Matches(/^([01]?\d|2[0-3]):[0-5]\d$/, {
    message: 'heureFin doit respecter le format HH:mm',
  })
  @IsOptional()
  heureFin?: string;

  @IsString()
  @IsOptional()
  contenuEnseigne?: string;

  @IsString({ message: 'La salle est obligatoire pour marquer une séance comme réalisée' })
  salle?: string;

  @IsString({
    message: 'Le type de séance est obligatoire pour marquer une séance comme réalisée',
  })
  typeSeance?: string;
}
