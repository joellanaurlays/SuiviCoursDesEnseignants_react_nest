import { registerDecorator } from 'class-validator';
import type { ValidationOptions } from 'class-validator';

/**
 * Valide un libelle d'annee universitaire au format "AAAA-AAAA"
 * ou la seconde annee suit immediatement la premiere (ex: 2025-2026).
 */
export function IsAcademicYear(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAcademicYear',
      target: object.constructor,
      propertyName,
      options: {
        message: 'Format attendu : AAAA-AAAA avec deux années consécutives (ex : 2025-2026)',
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;
          const match = /^(\d{4})-(\d{4})$/.exec(value);
          if (!match) return false;
          const start = Number(match[1]);
          const end = Number(match[2]);
          return end === start + 1 && start >= 2000 && start <= 2100;
        },
      },
    });
  };
}
