import { isIsoDate } from './dates.js';

// Validation cote client (miroir des regles du backend) : retourne un message ou null.

export function validateField(field, raw) {
  const value = typeof raw === 'string' ? raw.trim() : raw;
  const isEmpty = value === '' || value === null || value === undefined;
  const rules = field.rules ?? {};

  if (field.type === 'checkbox') return null;

  if (isEmpty) {
    if (!field.required) return null;
    return field.type === 'relation' || field.type === 'select'
      ? 'Veuillez faire un choix'
      : 'Ce champ est obligatoire';
  }

  if (field.type === 'date') {
    if (!isIsoDate(value)) return 'Choisissez une date dans le calendrier';
    const year = Number(value.slice(0, 4));
    if (year < 2000 || year > 2100) return 'L\'année doit être comprise entre 2000 et 2100';
    return null;
  }

  if (field.type === 'number') {
    const n = Number(value);
    if (!Number.isFinite(n)) return 'Saisissez un nombre';
    if (rules.integer && !Number.isInteger(n)) return 'Saisissez un nombre entier';
    if (rules.min !== undefined && rules.max !== undefined && (n < rules.min || n > rules.max)) {
      return `La valeur doit être comprise entre ${rules.min} et ${rules.max}`;
    }
    if (rules.min !== undefined && n < rules.min) return `La valeur minimale est ${rules.min}`;
    if (rules.max !== undefined && n > rules.max) return `La valeur maximale est ${rules.max}`;
    return null;
  }

  if (field.type === 'text') {
    const text = String(value);
    if (rules.minLength && text.length < rules.minLength) {
      return `Au moins ${rules.minLength} caractères`;
    }
    if (rules.maxLength && text.length > rules.maxLength) {
      return `${rules.maxLength} caractères maximum`;
    }
    if (rules.pattern && !rules.pattern.test(text)) {
      return rules.patternMessage ?? 'Format invalide';
    }
    if (rules.custom) {
      const message = rules.custom(text);
      if (message) return message;
    }
  }

  return null;
}

export function validateAll(fields, values) {
  const errors = {};
  fields.forEach((field) => {
    const message = validateField(field, values[field.name]);
    if (message) errors[field.name] = message;
  });
  return errors;
}

// Prepare l'objet envoye a l'API (textes nettoyes, nombres convertis).
export function toPayload(fields, values) {
  const payload = {};
  fields.forEach((field) => {
    const raw = values[field.name];
    if (field.type === 'checkbox') payload[field.name] = Boolean(raw);
    else if (field.type === 'date') {
      if (raw) payload[field.name] = raw; // date facultative vide : omise
    } else if (field.type === 'number' || field.type === 'relation') payload[field.name] = Number(raw);
    else payload[field.name] = typeof raw === 'string' ? raw.trim() : raw;
  });
  return payload;
}