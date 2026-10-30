import { registerDecorator } from 'class-validator';
import type { ValidationOptions } from 'class-validator';
import { isIsoDate } from './dates.js';

/** Valide une date du calendrier au format AAAA-MM-JJ (valeur d'un <input type="date">). */
export function IsIsoDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isIsoDate',
      target: object.constructor,
      propertyName,
      options: {
        message: 'Date invalide : choisissez une date dans le calendrier (AAAA-MM-JJ)',
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          if (!isIsoDate(value)) return false;
          const y = Number(value.slice(0, 4));
          return y >= 2000 && y <= 2100;
        },
      },
    });
  };
}