import { IsDateString, IsOptional, IsString, Matches } from 'class-validator';

/**
 * Réalisation d'une séance planifiée.
 *
 * L'enseignant responsable confirme les informations réellement observées :
 * date effective, horaires et contenu enseigné. Tous les champs sont
 * optionnels : s'ils sont absents, les valeurs déjà enregistrées sur la
 * séance sont conservées. La durée est TOUJOURS recalculée côté serveur à
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
}
