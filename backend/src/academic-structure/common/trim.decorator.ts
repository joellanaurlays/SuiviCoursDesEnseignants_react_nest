import { Transform } from 'class-transformer';

/** Supprime les espaces en debut/fin de chaine avant validation. */
export const Trim = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));
