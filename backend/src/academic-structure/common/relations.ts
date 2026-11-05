/**
 * Convertit une liste de chemins ('niveau', 'niveau.cycle', ...) en objet de relations
 * (`{ niveau: { cycle: true } }`) : TypeORM 1.x n'accepte plus les tableaux de chaînes.
 */
export function toRelations(paths: string[]): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  for (const path of paths) {
    let node = root;
    const parts = path.split('.');
    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const current = node[part];
      if (isLast) {
        if (current === undefined) node[part] = true;
      } else {
        if (typeof current !== 'object' || current === null) node[part] = {};
        node = node[part] as Record<string, unknown>;
      }
    });
  }
  return root;
}
