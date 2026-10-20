INSERT INTO sessions_examen (libelle, annee_universitaire, semestre, date_debut, date_fin)
VALUES
  ('Session Normale S1', '2025-2026', 'S1', '2026-01-12', '2026-01-24'),
  ('Session Normale S2', '2025-2026', 'S2', '2026-06-08', '2026-06-20')
ON CONFLICT DO NOTHING;
