import { IsEmail, IsNotEmpty, Length, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Adresse email invalide.' })
  email: string;

  @IsNotEmpty({ message: 'Le code de vérification est requis.' })
  @Length(6, 6, { message: 'Le code doit contenir 6 chiffres.' })
  @Matches(/^\d{6}$/, { message: 'Le code doit contenir 6 chiffres.' })
  code: string;

  @IsNotEmpty({ message: 'Le nouveau mot de passe est requis.' })
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' })
  newPassword: string;
}
