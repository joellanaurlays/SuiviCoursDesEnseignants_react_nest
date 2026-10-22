import { IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'Le mot de passe actuel est requis.' })
  currentPassword: string;

  @IsNotEmpty({ message: 'Le nouveau mot de passe est requis.' })
  @MinLength(6, { message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' })
  newPassword: string;
}