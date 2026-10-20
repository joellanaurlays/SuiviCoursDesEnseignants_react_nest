-- Seed M6 : examens + alertes (donnees statiques, taches T26-T30)
-- Idempotent : ON CONFLICT DO NOTHING + anti-doublon par libelle+salle+date

INSERT INTO examens (session_id, date_examen, heure_debut, heure_fin, salle, statut, notes_remises)
SELECT s.id, v.date_examen::date, v.heure_debut::time, v.heure_fin::time, v.salle, v.statut, false
FROM sessions_examen s
CROSS JOIN (VALUES
  ('Session Normale S1', '2026-01-13', '08:00', '10:00', 'Amphi A', 'A_VENIR'),
  ('Session Normale S1', '2026-01-14', '10:00', '12:00', 'Salle B1', 'A_VENIR'),
  ('Session Normale S1', '2026-01-15', '14:00', '16:00', 'Salle C2', 'A_VENIR'),
  ('Session Normale S2', '2026-06-09', '08:00', '10:00', 'Amphi A', 'A_VENIR'),
  ('Session Normale S2', '2026-06-10', '10:00', '12:00', 'Salle B1', 'A_VENIR')
) AS v(libelle_lib, date_examen, heure_debut, heure_fin, salle, statut)
WHERE s.libelle = v.libelle_lib
  AND NOT EXISTS (
    SELECT 1 FROM examens e
    WHERE e.session_id = s.id AND e.date_examen = v.date_examen::date AND e.salle = v.salle
  );

INSERT INTO alertes (examen_id, type_alerte, message, est_lue, est_traitee)
SELECT e.id, a.type_alerte, a.message, false, false
FROM examens e
CROSS JOIN (VALUES
  ('SESSION_NON_TERMINEE', 'Session S1 : examen non termine a J-7 de la cloture.'),
  ('NOTES_NON_REMISES', 'Notes non remises pour un examen termine depuis 48h.'),
  ('CHEVAUCHEMENT_SALLE', 'Chevauchement de salle detecte sur la meme demi-journee.')
) AS a(type_alerte, message)
WHERE e.date_examen = '2026-01-13'
  AND NOT EXISTS (
    SELECT 1 FROM alertes al WHERE al.examen_id = e.id AND al.type_alerte = a.type_alerte
  );
