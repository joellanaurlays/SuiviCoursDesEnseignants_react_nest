export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateLong(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatHoraire(debut: string, fin: string): string {
  return `${debut} - ${fin}`;
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuree(duree: number): string {
  const hours = Math.floor(duree);
  const minutes = Math.round((duree - hours) * 60);
  if (minutes === 0) return `${hours}h00`;
  return `${hours}h${minutes.toString().padStart(2, '0')}`;
}

export function totalHeures(items: { heuresRealisees: number }[]): number {
  return items.reduce((sum, item) => sum + (item.heuresRealisees || 0), 0);
}

export function totalVolume(items: { volumePrevu: number }[]): number {
  return items.reduce((sum, item) => sum + (item.volumePrevu || 0), 0);
}

export function progressionMoyennePonderee(items: { volumePrevu: number; heuresRealisees: number }[]): number {
  const volume = totalVolume(items);
  const realise = totalHeures(items);
  if (volume <= 0) return 0;
  return Math.min(Math.round((realise / volume) * 100), 100);
}