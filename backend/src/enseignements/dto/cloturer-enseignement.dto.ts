import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Clôture anticipée d'un enseignement, effectuée directement par l'enseignant
 * lorsque le contenu pédagogique est achevé avant le volume horaire prévu.
 *
 * Le motif est OBLIGATOIRE. Aucun autre champ n'est accepté : ni l'enseignant,
 * ni l'état, ni les heures, ni la progression, ni le volume. Ces valeurs sont
 * calculées par le serveur à partir des séances réelles.
 */
export class CloturerEnseignementDto {
  @IsString({ message: 'Le motif de la clôture anticipée est obligatoire' })
  @MinLength(5, {
    message: 'Le motif de la clôture anticipée est obligatoire (5 caractères minimum)',
  })
  @MaxLength(1000, { message: 'Le motif ne doit pas dépasser 1000 caractères' })
  motif: string;
}
