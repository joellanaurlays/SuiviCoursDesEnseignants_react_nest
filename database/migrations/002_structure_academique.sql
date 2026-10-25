-- Module 3 : structure académique (Membre 3, T11 à T15)
-- Tables gérées par TypeORM (synchronize en développement), comme le module examens.
-- Hiérarchie : mention → cycle → niveau → annee_universitaire → semestre → matiere (FK NOT NULL, ON DELETE CASCADE).



-- Name: annee_universitaire; Type: TABLE; Schema: public; Owner: -

CREATE TABLE public.annee_universitaire (
    id integer NOT NULL,
    libelle character varying(9) NOT NULL,
    "niveauId" integer NOT NULL
);

-- Name: annee_universitaire_id_seq; Type: SEQUENCE; Schema: public; Owner: -

CREATE SEQUENCE public.annee_universitaire_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Name: annee_universitaire_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -

ALTER SEQUENCE public.annee_universitaire_id_seq OWNED BY public.annee_universitaire.id;

-- Name: cycle; Type: TABLE; Schema: public; Owner: -

CREATE TABLE public.cycle (
    id integer NOT NULL,
    type character varying(20) NOT NULL,
    "mentionId" integer NOT NULL
);

-- Name: cycle_id_seq; Type: SEQUENCE; Schema: public; Owner: -

CREATE SEQUENCE public.cycle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Name: cycle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -

ALTER SEQUENCE public.cycle_id_seq OWNED BY public.cycle.id;

-- Name: matiere; Type: TABLE; Schema: public; Owner: -

CREATE TABLE public.matiere (
    id integer NOT NULL,
    nom character varying(150) NOT NULL,
    "volumeHoraire" integer NOT NULL,
    "semestreId" integer NOT NULL
);

-- Name: matiere_id_seq; Type: SEQUENCE; Schema: public; Owner: -

CREATE SEQUENCE public.matiere_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Name: matiere_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -

ALTER SEQUENCE public.matiere_id_seq OWNED BY public.matiere.id;

-- Name: mention; Type: TABLE; Schema: public; Owner: -

CREATE TABLE public.mention (
    id integer NOT NULL,
    nom character varying(100) NOT NULL
);

-- Name: mention_id_seq; Type: SEQUENCE; Schema: public; Owner: -

CREATE SEQUENCE public.mention_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Name: mention_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -

ALTER SEQUENCE public.mention_id_seq OWNED BY public.mention.id;

-- Name: niveau; Type: TABLE; Schema: public; Owner: -

CREATE TABLE public.niveau (
    id integer NOT NULL,
    libelle character varying(30) NOT NULL,
    "cycleId" integer NOT NULL
);

-- Name: niveau_id_seq; Type: SEQUENCE; Schema: public; Owner: -

CREATE SEQUENCE public.niveau_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Name: niveau_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -

ALTER SEQUENCE public.niveau_id_seq OWNED BY public.niveau.id;

-- Name: semestre; Type: TABLE; Schema: public; Owner: -

CREATE TABLE public.semestre (
    id integer NOT NULL,
    numero integer NOT NULL,
    "anneeUniversitaireId" integer NOT NULL
);

-- Name: semestre_id_seq; Type: SEQUENCE; Schema: public; Owner: -

CREATE SEQUENCE public.semestre_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Name: semestre_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -

ALTER SEQUENCE public.semestre_id_seq OWNED BY public.semestre.id;

-- Name: annee_universitaire id; Type: DEFAULT; Schema: public; Owner: -

ALTER TABLE ONLY public.annee_universitaire ALTER COLUMN id SET DEFAULT nextval('public.annee_universitaire_id_seq'::regclass);

-- Name: cycle id; Type: DEFAULT; Schema: public; Owner: -

ALTER TABLE ONLY public.cycle ALTER COLUMN id SET DEFAULT nextval('public.cycle_id_seq'::regclass);

-- Name: matiere id; Type: DEFAULT; Schema: public; Owner: -

ALTER TABLE ONLY public.matiere ALTER COLUMN id SET DEFAULT nextval('public.matiere_id_seq'::regclass);

-- Name: mention id; Type: DEFAULT; Schema: public; Owner: -

ALTER TABLE ONLY public.mention ALTER COLUMN id SET DEFAULT nextval('public.mention_id_seq'::regclass);

-- Name: niveau id; Type: DEFAULT; Schema: public; Owner: -

ALTER TABLE ONLY public.niveau ALTER COLUMN id SET DEFAULT nextval('public.niveau_id_seq'::regclass);

-- Name: semestre id; Type: DEFAULT; Schema: public; Owner: -

ALTER TABLE ONLY public.semestre ALTER COLUMN id SET DEFAULT nextval('public.semestre_id_seq'::regclass);

-- Name: semestre PK_1e3b225e8f25f6f8d91009afb70; Type: CONSTRAINT; Schema: public; Owner: -

ALTER TABLE ONLY public.semestre
    ADD CONSTRAINT "PK_1e3b225e8f25f6f8d91009afb70" PRIMARY KEY (id);

-- Name: niveau PK_6d83eba95a8ba1992c674c47f48; Type: CONSTRAINT; Schema: public; Owner: -

ALTER TABLE ONLY public.niveau
    ADD CONSTRAINT "PK_6d83eba95a8ba1992c674c47f48" PRIMARY KEY (id);

-- Name: annee_universitaire PK_6ea90bd4eeea414bba6ffbd936b; Type: CONSTRAINT; Schema: public; Owner: -

ALTER TABLE ONLY public.annee_universitaire
    ADD CONSTRAINT "PK_6ea90bd4eeea414bba6ffbd936b" PRIMARY KEY (id);

-- Name: mention PK_9b02b76c4b65e3c35c1a545bf57; Type: CONSTRAINT; Schema: public; Owner: -

ALTER TABLE ONLY public.mention
    ADD CONSTRAINT "PK_9b02b76c4b65e3c35c1a545bf57" PRIMARY KEY (id);

-- Name: cycle PK_af5984cb5853f1f88109c9ea2b7; Type: CONSTRAINT; Schema: public; Owner: -

ALTER TABLE ONLY public.cycle
    ADD CONSTRAINT "PK_af5984cb5853f1f88109c9ea2b7" PRIMARY KEY (id);

-- Name: matiere PK_dc64751218014af8d3ef885facb; Type: CONSTRAINT; Schema: public; Owner: -

ALTER TABLE ONLY public.matiere
    ADD CONSTRAINT "PK_dc64751218014af8d3ef885facb" PRIMARY KEY (id);

-- Name: mention UQ_2312de48d3c3a3ff97e6ee56794; Type: CONSTRAINT; Schema: public; Owner: -

ALTER TABLE ONLY public.mention
    ADD CONSTRAINT "UQ_2312de48d3c3a3ff97e6ee56794" UNIQUE (nom);

-- Name: cycle UQ_bc1591941bb9c449acccfa0c44f; Type: CONSTRAINT; Schema: public; Owner: -

ALTER TABLE ONLY public.cycle
    ADD CONSTRAINT "UQ_bc1591941bb9c449acccfa0c44f" UNIQUE ("mentionId", type);

-- Name: annee_universitaire UQ_cb411a3f68da429781b0a107260; Type: CONSTRAINT; Schema: public; Owner: -

ALTER TABLE ONLY public.annee_universitaire
    ADD CONSTRAINT "UQ_cb411a3f68da429781b0a107260" UNIQUE ("niveauId", libelle);

-- Name: niveau UQ_ccb3712b69dd8ca1b36c42c320f; Type: CONSTRAINT; Schema: public; Owner: -

ALTER TABLE ONLY public.niveau
    ADD CONSTRAINT "UQ_ccb3712b69dd8ca1b36c42c320f" UNIQUE ("cycleId", libelle);

-- Name: semestre UQ_f7f3072cfd6fad98dc964854dd6; Type: CONSTRAINT; Schema: public; Owner: -

ALTER TABLE ONLY public.semestre
    ADD CONSTRAINT "UQ_f7f3072cfd6fad98dc964854dd6" UNIQUE ("anneeUniversitaireId", numero);

-- Name: matiere UQ_ff9f3f1ed4cc601ea2fdfc1109b; Type: CONSTRAINT; Schema: public; Owner: -

ALTER TABLE ONLY public.matiere
    ADD CONSTRAINT "UQ_ff9f3f1ed4cc601ea2fdfc1109b" UNIQUE ("semestreId", nom);

-- Name: annee_universitaire FK_4f0875509fc993d2d111816cb1d; Type: FK CONSTRAINT; Schema: public; Owner: -

ALTER TABLE ONLY public.annee_universitaire
    ADD CONSTRAINT "FK_4f0875509fc993d2d111816cb1d" FOREIGN KEY ("niveauId") REFERENCES public.niveau(id) ON DELETE CASCADE;

-- Name: matiere FK_9a8439b36693954a45b8ec7b90b; Type: FK CONSTRAINT; Schema: public; Owner: -

ALTER TABLE ONLY public.matiere
    ADD CONSTRAINT "FK_9a8439b36693954a45b8ec7b90b" FOREIGN KEY ("semestreId") REFERENCES public.semestre(id) ON DELETE CASCADE;

-- Name: semestre FK_c06f21c4017f0f6be454c1a853a; Type: FK CONSTRAINT; Schema: public; Owner: -

ALTER TABLE ONLY public.semestre
    ADD CONSTRAINT "FK_c06f21c4017f0f6be454c1a853a" FOREIGN KEY ("anneeUniversitaireId") REFERENCES public.annee_universitaire(id) ON DELETE CASCADE;

-- Name: cycle FK_c12c18bdba118b919d8655290e1; Type: FK CONSTRAINT; Schema: public; Owner: -

ALTER TABLE ONLY public.cycle
    ADD CONSTRAINT "FK_c12c18bdba118b919d8655290e1" FOREIGN KEY ("mentionId") REFERENCES public.mention(id) ON DELETE CASCADE;

-- Name: niveau FK_c216de961b2235fb3ec36c393e1; Type: FK CONSTRAINT; Schema: public; Owner: -

ALTER TABLE ONLY public.niveau
    ADD CONSTRAINT "FK_c216de961b2235fb3ec36c393e1" FOREIGN KEY ("cycleId") REFERENCES public.cycle(id) ON DELETE CASCADE;


