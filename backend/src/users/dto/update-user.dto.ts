import { IsBoolean, IsEmail, IsInt, IsOptional, IsPositive, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Adresse email invalide.' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Le prénom doit contenir au moins 2 caractères.' })
  @MaxLength(50, { message: 'Le prénom ne doit pas dépasser 50 caractères.' })
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères.' })
  @MaxLength(50, { message: 'Le nom ne doit pas dépasser 50 caractères.' })
  lastName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9+\s-]{6,20}$/, { message: 'Numéro de téléphone invalide.' })
  phone?: string;

  @IsOptional()
  @IsInt({ message: 'Le rôle doit être un identifiant numérique.' })
  @IsPositive({ message: 'Le rôle doit être un identifiant valide.' })
  roleId?: number;

  @IsOptional()
  @IsBoolean({ message: 'Le champ isActive doit être un booléen.' })
  isActive?: boolean;
}
