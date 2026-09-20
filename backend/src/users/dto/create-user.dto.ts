import { IsBoolean, IsEmail, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Adresse email invalide.' })
  email: string;

  @IsNotEmpty({ message: 'Le mot de passe est requis.' })
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' })
  password: string;

  @IsNotEmpty({ message: 'Le prénom est requis.' })
  @IsString()
  @MinLength(2, { message: 'Le prénom doit contenir au moins 2 caractères.' })
  @MaxLength(50, { message: 'Le prénom ne doit pas dépasser 50 caractères.' })
  firstName: string;

  @IsNotEmpty({ message: 'Le nom est requis.' })
  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères.' })
  @MaxLength(50, { message: 'Le nom ne doit pas dépasser 50 caractères.' })
  lastName: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9+\s-]{6,20}$/, { message: 'Numéro de téléphone invalide.' })
  phone?: string;

  @IsInt({ message: 'Le rôle doit être un identifiant numérique.' })
  @IsPositive({ message: 'Le rôle doit être un identifiant valide.' })
  roleId: number;

  @IsOptional()
  @IsBoolean({ message: 'Le champ isActive doit être un booléen.' })
  isActive?: boolean;
}
