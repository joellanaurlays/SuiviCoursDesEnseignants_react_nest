-- Migration 20261030_001
-- Conversion de public.examens.enseignement_id : UUID vers TEXT.
ALTER TABLE public.examens
ALTER COLUMN enseignement_id TYPE TEXT
USING enseignement_id::TEXT;