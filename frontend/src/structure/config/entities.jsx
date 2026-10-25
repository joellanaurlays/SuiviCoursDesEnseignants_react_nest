// Configuration centrale du module "Structure academique" (Membre 3).
// Hierarchie : Mention -> Cycle -> Niveau -> AnneeUniversitaire -> Semestre -> Matiere
//
// Chaque entite decrit : son endpoint, ses colonnes, ses champs de formulaire
// (avec regles de validation identiques a celles du backend) et la facon
// d'afficher un element dans une liste deroulante (`optionLabel`).

const dash = '—';

export const entities = {
  mentions: {
    label: 'Mentions',
    singular: 'Mention',
    article: 'une',
    endpoint: '/mentions',
    description: "Les grandes filières de l'établissement (ex : Informatique, Gestion).",
    optionLabel: (r) => r.nom,
    searchText: (r) => r.nom,
    columns: [
      { key: 'nom', label: 'Nom' },
      {
        key: 'cycles',
        label: 'Cycles',
        render: (r) =>
          r.cycles?.length ? r.cycles.map((c) => c.type).join(', ') : <span className="muted">{dash}</span>,
      },
    ],
    fields: [
      {
        name: 'nom',
        label: 'Nom de la mention',
        type: 'text',
        required: true,
        placeholder: 'ex : Informatique',
        rules: { minLength: 2, maxLength: 100 },
      },
    ],
  },

  cycles: {
    label: 'Cycles',
    singular: 'Cycle',
    article: 'un',
    endpoint: '/cycles',
    description: 'Licence ou Master, rattaché à une mention (un seul cycle de chaque type par mention).',
    optionLabel: (r) => `${r.type} — ${r.mention?.nom ?? ''}`,
    searchText: (r) => `${r.type} ${r.mention?.nom ?? ''}`,
    columns: [
      { key: 'type', label: 'Type', render: (r) => <span className="pill">{r.type}</span> },
      { key: 'mention', label: 'Mention', render: (r) => r.mention?.nom ?? dash },
    ],
    fields: [
      {
        name: 'type',
        label: 'Type de cycle',
        type: 'select',
        required: true,
        options: [
          { value: 'Licence', label: 'Licence' },
          { value: 'Master', label: 'Master' },
        ],
      },
      { name: 'mentionId', label: 'Mention', type: 'relation', required: true, target: 'mentions' },
    ],
  },

  niveaux: {
    label: 'Niveaux',
    singular: 'Niveau',
    article: 'un',
    endpoint: '/niveaux',
    description: "Les niveaux d'étude (L1, L2, L3, M1, M2) au sein d'un cycle.",
    optionLabel: (r) => `${r.libelle} — ${r.cycle?.type ?? ''} ${r.cycle?.mention?.nom ?? ''}`.trim(),
    searchText: (r) => `${r.libelle} ${r.cycle?.type ?? ''} ${r.cycle?.mention?.nom ?? ''}`,
    columns: [
      { key: 'libelle', label: 'Niveau', render: (r) => <strong>{r.libelle}</strong> },
      {
        key: 'cycle',
        label: 'Cycle',
        render: (r) => (r.cycle ? `${r.cycle.type} — ${r.cycle.mention?.nom ?? ''}` : dash),
      },
    ],
    fields: [
      {
        name: 'libelle',
        label: 'Libellé du niveau',
        type: 'text',
        required: true,
        placeholder: 'ex : L1, L2, M1…',
        rules: {
          minLength: 2,
          maxLength: 30,
          pattern: /^[\p{L}0-9 _-]+$/u,
          patternMessage: 'Lettres, chiffres, espaces ou tirets uniquement',
        },
      },
      { name: 'cycleId', label: 'Cycle', type: 'relation', required: true, target: 'cycles' },
    ],
  },

  'annees-universitaires': {
    label: 'Années universitaires',
    singular: 'Année universitaire',
    article: 'une',
    endpoint: '/annees-universitaires',
    description: 'Les années universitaires (ex : 2025-2026) rattachées à un niveau.',
    optionLabel: (r) => `${r.libelle} — ${r.niveau?.libelle ?? ''} (${r.niveau?.cycle?.mention?.nom ?? ''})`,
    searchText: (r) => `${r.libelle} ${r.niveau?.libelle ?? ''} ${r.niveau?.cycle?.mention?.nom ?? ''}`,
    columns: [
      { key: 'libelle', label: 'Année', render: (r) => <strong>{r.libelle}</strong> },
      {
        key: 'niveau',
        label: 'Niveau',
        render: (r) =>
          r.niveau
            ? `${r.niveau.libelle} — ${r.niveau.cycle?.type ?? ''} ${r.niveau.cycle?.mention?.nom ?? ''}`
            : dash,
      },
    ],
    fields: [
      {
        name: 'libelle',
        label: "Année universitaire",
        type: 'text',
        required: true,
        placeholder: 'ex : 2025-2026',
        help: 'Format AAAA-AAAA, deux années consécutives.',
        rules: {
          pattern: /^(\d{4})-(\d{4})$/,
          patternMessage: 'Format attendu : AAAA-AAAA (ex : 2025-2026)',
          custom: (v) => {
            const m = /^(\d{4})-(\d{4})$/.exec(v);
            return m && Number(m[2]) !== Number(m[1]) + 1 ? 'Les deux années doivent être consécutives' : null;
          },
        },
      },
      { name: 'niveauId', label: 'Niveau', type: 'relation', required: true, target: 'niveaux' },
    ],
  },

  semestres: {
    label: 'Semestres',
    singular: 'Semestre',
    article: 'un',
    endpoint: '/semestres',
    description: 'Les semestres (S1, S2…) rattachés à une année universitaire.',
    optionLabel: (r) =>
      `S${r.numero} — ${r.anneeUniversitaire?.libelle ?? ''} · ${r.anneeUniversitaire?.niveau?.libelle ?? ''}`,
    searchText: (r) =>
      `S${r.numero} ${r.anneeUniversitaire?.libelle ?? ''} ${r.anneeUniversitaire?.niveau?.libelle ?? ''}`,
    columns: [
      { key: 'numero', label: 'Semestre', render: (r) => <strong>S{r.numero}</strong> },
      {
        key: 'annee',
        label: 'Année universitaire',
        render: (r) =>
          r.anneeUniversitaire
            ? `${r.anneeUniversitaire.libelle} — ${r.anneeUniversitaire.niveau?.libelle ?? ''}`
            : dash,
      },
    ],
    fields: [
      {
        name: 'numero',
        label: 'Numéro du semestre',
        type: 'number',
        required: true,
        placeholder: 'ex : 1',
        rules: { integer: true, min: 1, max: 10 },
      },
      {
        name: 'anneeUniversitaireId',
        label: 'Année universitaire',
        type: 'relation',
        required: true,
        target: 'annees-universitaires',
      },
    ],
  },

  matieres: {
    label: 'Matières',
    singular: 'Matière',
    article: 'une',
    endpoint: '/matieres',
    description: "Les matières enseignées pendant un semestre, avec leur volume horaire.",
    optionLabel: (r) => r.nom,
    searchText: (r) =>
      `${r.nom} S${r.semestre?.numero ?? ''} ${r.semestre?.anneeUniversitaire?.niveau?.libelle ?? ''}`,
    columns: [
      { key: 'nom', label: 'Matière', render: (r) => <strong>{r.nom}</strong> },
      { key: 'volumeHoraire', label: 'Volume', render: (r) => `${r.volumeHoraire} h` },
      {
        key: 'semestre',
        label: 'Semestre',
        render: (r) =>
          r.semestre
            ? `S${r.semestre.numero} — ${r.semestre.anneeUniversitaire?.niveau?.libelle ?? ''} · ${
                r.semestre.anneeUniversitaire?.libelle ?? ''
              }`
            : dash,
      },
    ],
    fields: [
      {
        name: 'nom',
        label: 'Nom de la matière',
        type: 'text',
        required: true,
        placeholder: 'ex : Algorithmique',
        rules: { minLength: 2, maxLength: 150 },
      },
      {
        name: 'volumeHoraire',
        label: 'Volume horaire (heures)',
        type: 'number',
        required: true,
        placeholder: 'ex : 40',
        rules: { integer: true, min: 1, max: 500 },
      },
      { name: 'semestreId', label: 'Semestre', type: 'relation', required: true, target: 'semestres' },
    ],
  },
};

// Ordre logique de creation (de la racine de la hierarchie vers les feuilles)
export const navOrder = ['mentions', 'cycles', 'niveaux', 'annees-universitaires', 'semestres', 'matieres'];

// Cles renvoyees par /api/stats pour chaque entite
export const statsKey = {
  mentions: 'mentions',
  cycles: 'cycles',
  niveaux: 'niveaux',
  'annees-universitaires': 'anneesUniversitaires',
  semestres: 'semestres',
  matieres: 'matieres',
};
