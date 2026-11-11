
import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository, LessThan, MoreThan } from 'typeorm';
import { Cycle } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthContext } from '../auth/auth-context.js';
import { Role } from '../auth/roles.enum.js';
import { estAnneeUniversitaireValide, SEMESTRES_PAR_NIVEAU } from '../enseignements/domain/referentiel-enseignement.js';

// Sous-parcours réellement présents pour la mention Informatique (parcours de mention -> sous-parcours).
const SOUS_PARCOURS_PAR_MENTION: Record<string, string[]> = {
  informatique: ['DA2I', 'Science des donnees'],
};

import { SessionExamen } from './entities/session-examen.entity.js';
import { Examen } from './entities/examen.entity.js';
import { Alerte } from './entities/alerte.entity.js';
import { Message } from './entities/message.entity.js';

import {
  CreateSessionDto,
  UpdateSessionDto,
  CreateExamenDto,
  CreateAlerteDto,
  CreateMessageDto,
} from './dto/exams.dto.js';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(SessionExamen)
    private readonly sessions: Repository<SessionExamen>,

    @InjectRepository(Examen)
    private readonly examens: Repository<Examen>,

    @InjectRepository(Alerte)
    private readonly alertes: Repository<Alerte>,

    @InjectRepository(Message)
    private readonly messages: Repository<Message>,

    private readonly prisma: PrismaService,
  ) {}

  private async getEnseignementIdsForRead(context: AuthContext): Promise<string[] | null> {
    if (context.role === Role.SCOLARITE) return null;
    if (context.role === Role.ADMINISTRATEUR) return null;
    if (context.role === Role.ENSEIGNANT) {
      const user = await this.prisma.user.findUnique({
        where: { id: parseInt(context.userId) },
        select: { firstName: true, lastName: true },
      });
      if (!user) return [];
      const lastName = user.lastName;
      // Convention réellement enregistrée en base : Enseignement.enseignantId
      // contient la chaîne « Professeur {lastName} » (ex. « Professeur Rakoto »).
      const identiteEnseignant = `Professeur ${lastName}`;
      const ids = await this.prisma.enseignement.findMany({
        where: { enseignantId: identiteEnseignant },
        select: { id: true },
      });
      return ids.map((row) => row.id);
    }
    if (context.role !== Role.RESPONSABLE_MENTION) {
      throw new ForbiddenException('Consultation interdite.');
    }

    const mentionId = context.mentionId?.trim();
    const parcours = context.parcours?.trim();
    const cycles = [...new Set((context.cycles ?? []).map(c => c.trim().toUpperCase()))];

    if (!mentionId || !parcours || !cycles.length ||
        cycles.some(c => c !== 'LICENCE' && c !== 'MASTER')) {
      throw new ForbiddenException('PÃ©rimÃ¨tre de mention incomplet.');
    }

    const sousParcours = SOUS_PARCOURS_PAR_MENTION[parcours.toLowerCase()] ?? [];
    const parcoursAutorises = [parcours, ...sousParcours];

    const rows = await this.prisma.enseignement.findMany({
      where: { mentionId: { equals: mentionId, mode: 'insensitive' }, parcours: { in: parcoursAutorises }, cycle: { in: cycles as Cycle[] } },
      select: { id: true },
    });
    return rows.map(row => row.id);
  }

  async findSessions(context: AuthContext) {
    const ids = await this.getEnseignementIdsForRead(context);
    if (ids === null) return this.sessions.find({ order: { dateDebut: 'DESC' } });
    if (!ids.length) return [];

    const examens = await this.examens.find({
      select: { sessionId: true },
      where: { enseignementId: In(ids) },
    });
    const sessionIds = [...new Set(examens.map(e => e.sessionId).filter(Boolean))];
    if (!sessionIds.length) return [];

    return this.sessions.find({
      where: { id: In(sessionIds) },
      order: { dateDebut: 'DESC' },
    });
  }
  // Validations partagées création/modification (phase 1) : période, année universitaire, semestre.
  private validerChampsSession(dateDebut: string, dateFin: string, anneeUniversitaire: string, semestre: string) {
    // Règle reprise de l'implémentation _UML : cohérence temporelle de la période.
    if (dateFin.slice(0, 10) < dateDebut.slice(0, 10)) {
      throw new BadRequestException('La date de fin doit être postérieure ou égale à la date de début.');
    }
    // Référentiel EMIT existant : format AAAA-AAAA avec deux années consécutives.
    if (!estAnneeUniversitaireValide(anneeUniversitaire)) {
      throw new BadRequestException("L'année universitaire doit respecter le format AAAA-AAAA avec deux années consécutives.");
    }
    // Référentiel EMIT existant (SEMESTRES_PAR_NIVEAU) : S1 à S10.
    const semestresAutorises = [...new Set(Object.values(SEMESTRES_PAR_NIVEAU).flat())];
    if (!semestresAutorises.includes(semestre)) {
      throw new BadRequestException(`Semestre invalide : ${semestre}. Semestres autorisés : ${semestresAutorises.join(', ')}.`);
    }
  }

  createSession(dto: CreateSessionDto) {
    const anneeUniversitaire = dto.anneeUniversitaire.trim();
    const semestre = dto.semestre.trim();
    this.validerChampsSession(dto.dateDebut, dto.dateFin, anneeUniversitaire, semestre);
    const session = this.sessions.create({ ...dto, anneeUniversitaire, semestre });
    return this.sessions.save(session);
  }

  async updateSession(id: string, dto: UpdateSessionDto) {
    const session = await this.sessions.findOneBy({ id });

    if (!session) {
      throw new NotFoundException('Session introuvable');
    }

    // Décision validée : une session clôturée ne peut plus être modifiée.
    if (session.estCloturee) {
      throw new BadRequestException('Impossible de modifier une session clôturée.');
    }

    // Mise à jour partielle : les champs absents conservent leur valeur, puis revalidation complète.
    const anneeUniversitaire = (dto.anneeUniversitaire ?? session.anneeUniversitaire).trim();
    const semestre = (dto.semestre ?? session.semestre).trim();
    const dateDebut = dto.dateDebut ?? session.dateDebut;
    const dateFin = dto.dateFin ?? session.dateFin;
    this.validerChampsSession(dateDebut, dateFin, anneeUniversitaire, semestre);

    // Invariant existant (createExamen) : tout examen rattaché doit rester dans la période de la session.
    const periodeModifiee = dateDebut.slice(0, 10) !== session.dateDebut.slice(0, 10)
      || dateFin.slice(0, 10) !== session.dateFin.slice(0, 10);
    if (periodeModifiee) {
      const examens = await this.examens.find({ where: { sessionId: id }, select: { id: true, dateExamen: true } });
      const horsPeriode = examens.filter((examen) => examen.dateExamen.slice(0, 10) < dateDebut.slice(0, 10)
        || examen.dateExamen.slice(0, 10) > dateFin.slice(0, 10));
      if (horsPeriode.length) {
        throw new BadRequestException('La période de la session ne peut pas être modifiée : au moins un examen rattaché se situerait en dehors de la nouvelle période.');
      }
    }

    if (dto.libelle !== undefined) session.libelle = dto.libelle;
    session.anneeUniversitaire = anneeUniversitaire;
    session.semestre = semestre;
    session.dateDebut = dateDebut;
    session.dateFin = dateFin;

    return this.sessions.save(session);
  }

  async cloturerSession(id: string) {
    const session = await this.sessions.findOneBy({ id });

    if (!session) {
      throw new NotFoundException('Session introuvable');
    }

    session.estCloturee = true;

    return this.sessions.save(session);
  }

  // Examens

  async findExamens(sessionId: string | undefined, context: AuthContext) {
    const ids = await this.getEnseignementIdsForRead(context);
    const where: FindOptionsWhere<Examen> = sessionId ? { sessionId } : {};

    if (ids !== null) {
      if (!ids.length) return [];
      where.enseignementId = In(ids);
    }

    return this.examens.find({
      where,
      relations: { session: true },
      order: { dateExamen: 'ASC' },
    });
  }
  async createExamen(dto: CreateExamenDto) {
    // 1. VÃ©rifier que l'enseignement existe
    const enseignement = await this.prisma.enseignement.findUnique({
      where: { id: dto.enseignementId },
      select: { id: true, matiereId: true, enseignantId: true },
    });

    if (!enseignement) {
      throw new NotFoundException('Enseignement introuvable.');
    }

    // 2. VÃ©rifier que la session existe
    const session = await this.sessions.findOneBy({ id: dto.sessionId });
    if (!session) {
      throw new NotFoundException('Session introuvable.');
    }

    // 3. VÃ©rifier que la session n'est pas clÃ´turÃ©e
    if (session.estCloturee) {
      throw new BadRequestException('Impossible de crÃ©er un examen sur une session cloturÃ©e.');
    }

    // 4. VÃ©rifier que la date de l'examen appartient Ã  la pÃ©riode de la session
    const dateExamen = new Date(dto.dateExamen);
    const dateDebutSession = new Date(session.dateDebut);
    const dateFinSession = new Date(session.dateFin);
    if (dateExamen < dateDebutSession || dateExamen > dateFinSession) {
      throw new BadRequestException('La date de l\'examen doit appartenir Ã  la pÃ©riode de la session.');
    }

    // 5. VÃ©rifier que l\'heure de fin est postÃ©rieure Ã  l\'heure de dÃ©but
    // 5. VÃ©rifier que l'heure de fin est postÃ©rieure Ã  l'heure de dÃ©but (si les deux sont fournies)
    if (dto.heureDebut && dto.heureFin) {
      const heureDebut = new Date(`1970-01-01T${dto.heureDebut}`);
      const heureFin = new Date(`1970-01-01T${dto.heureFin}`);
      if (heureFin <= heureDebut) {
        throw new BadRequestException('L\'heure de fin doit Ãªtre postÃ©rieure Ã  l\'heure de dÃ©but.');
      }
    }

    // 6. VÃ©rifier qu\'aucun examen ne rÃ©serve la mÃªme salle sur un crÃ©neau qui se chevauche
    // 6. VÃ©rifier qu'aucun examen ne rÃ©serve la mÃªme salle sur un crÃ©neau qui se chevauche
    if (dto.heureDebut && dto.heureFin && dto.salle) {
      const examenEnCours = await this.examens.find({
      where: [
        {
          sessionId: dto.sessionId,
          salle: dto.salle,
          heureDebut: LessThan(dto.heureFin),
          heureFin: MoreThan(dto.heureDebut),
        },
      ],
    });
    if (examenEnCours.length > 0) {
      throw new ConflictException('Une sÃ©ance est dÃ©jÃ  rÃ©servÃ©e sur cette salle pour ce crÃ©neau.');
    }
    }

    const examen = this.examens.create({
      ...dto,
      enseignementId: enseignement.id,
    });

    return this.examens.save(examen);
  }

  async changerStatut(
    id: string,
    statut: 'A_VENIR' | 'EN_COURS' | 'TERMINE',
  ) {
    const examen = await this.examens.findOneBy({ id });

    if (!examen) {
      throw new NotFoundException('Examen introuvable');
    }

    // Progression autorisÃ©e : A_VENIR -> EN_COURS -> TERMINE.
    // Le passage direct A_VENIR -> TERMINE reste autorisÃ©.
    // Aucun retour depuis TERMINE ou EN_COURS vers un statut antÃ©rieur.
    const transitionAutorisee =
      examen.statut === statut ||
      (examen.statut === 'A_VENIR' &&
        (statut === 'EN_COURS' || statut === 'TERMINE')) ||
      (examen.statut === 'EN_COURS' && statut === 'TERMINE');

    if (!transitionAutorisee) {
      throw new BadRequestException(
        `Transition de statut non autorisÃ©e : ${examen.statut} -> ${statut}`,
      );
    }

    examen.statut = statut;

    return this.examens.save(examen);
  }

  // Remise des notes : suivi du statut uniquement, sans gestion des notes individuelles

  async marquerNotesRemises(id: string) {
    const examen = await this.examens.findOneBy({ id });

    if (!examen) {
      throw new NotFoundException('Examen introuvable');
    }

    // La remise est interdite tant que l'examen n'est pas terminÃ©.
    if (examen.statut !== 'TERMINE') {
      throw new BadRequestException(
        'Impossible de remettre des notes sur un examen non terminÃ©',
      );
    }

    // OpÃ©ration idempotente : ne pas modifier une remise dÃ©jÃ  enregistrÃ©e.
    if (examen.notesRemises) {
      return examen;
    }

    examen.notesRemises = true;
    examen.dateRemiseNotes = new Date();

    return this.examens.save(examen);
  }

  // Alertes

  async findAlertes(nonLues = false, context?: AuthContext) {
    const ids = context ? await this.getEnseignementIdsForRead(context) : null;
    const where: any = nonLues ? { estLue: false } : {};

    if (ids !== null) {
      if (!ids.length) return [];
      const examens = await this.examens.find({ select: { id: true }, where: { enseignementId: In(ids) } });
      const examenIds = examens.map((examen) => examen.id);
      if (!examenIds.length) return [];
      where.examenId = In(examenIds);
    }

    return this.alertes.find({
      where,
      relations: { examen: true },
      order: { createdAt: 'DESC' },
    });
  }

  async createAlerte(dto: CreateAlerteDto) {
    // 1. VÃ©rifier que l'examen associÃ© existe si un examenId est fourni
    if (dto.examenId) {
      const examen = await this.examens.findOneBy({ id: dto.examenId });
      if (!examen) {
        throw new NotFoundException('Examen introuvable pour l\'alerte.');
      }
    }

    // 2. VÃ©rifier les types d'alertes acceptÃ©s
    const typesAcceptes = ['NOTES_NON_REMISES', 'EXAMEN_APPROCHANT', 'SESSION_OUVERTE', 'AUTRE'];
    if (!typesAcceptes.includes(dto.typeAlerte)) {
      throw new BadRequestException(`Type d\'alerte invalide : ${dto.typeAlerte}. Types acceptÃ©s : ${typesAcceptes.join(', ')}.`);
    }

    // 3. Refuser les doublons pertinents (mÃªme type + mÃªme examen)
    const existant = await this.alertes.findOne({
      where: { examenId: dto.examenId, typeAlerte: dto.typeAlerte },
      relations: { examen: true },
    });
    if (existant) {
      throw new ConflictException('Une alerte de ce type existe dÃ©jÃ  pour cet examen.');
    }

    const alerte = this.alertes.create({ ...dto });
    return this.alertes.save(alerte);
  }

  async marquerLue(id: string) {
    const alerte = await this.alertes.findOneBy({ id });

    if (!alerte) {
      throw new NotFoundException('Alerte introuvable');
    }

    alerte.estLue = true;

    return this.alertes.save(alerte);
  }

  async marquerTraitee(id: string) {
    const alerte = await this.alertes.findOneBy({ id });

    if (!alerte) {
      throw new NotFoundException('Alerte introuvable');
    }

    alerte.estTraitee = true;

    return this.alertes.save(alerte);
  }

  // ---------- Messagerie Scolarité ↔ Enseignant ----------

  private async verifierAccesExamen(examen: Examen, enseignement: { id: string; enseignantId: string | null } | null, context: AuthContext): Promise<void> {
    const isScolarite = context.role === Role.SCOLARITE || context.role === Role.ADMINISTRATEUR;
    if (isScolarite) return;

    const userId = parseInt(context.userId, 10);

    if (context.role === Role.ENSEIGNANT) {
      if (!enseignement) {
        throw new ForbiddenException('Accès interdit à cette conversation.');
      }
      try {
        const teacherId = await this.resoudreCompteEnseignant(enseignement);
        if (teacherId !== userId) {
          throw new ForbiddenException('Accès interdit à cette conversation.');
        }
      } catch (error) {
        if (error instanceof ForbiddenException) throw error;
        throw new ForbiddenException('Accès interdit à cette conversation.');
      }
      return;
    }

    if (context.role === Role.RESPONSABLE_MENTION) {
      const ids = await this.getEnseignementIdsForRead(context);
      if (!ids || !enseignement || !ids.includes(enseignement.id)) {
        throw new ForbiddenException('Accès interdit à cette conversation.');
      }
      return;
    }

    throw new ForbiddenException('Accès interdit à cette conversation.');
  }

  private async resoudreExamenEtEnseignement(examenId: string) {
    const examen = await this.examens.findOneBy({ id: examenId });
    if (!examen) {
      throw new NotFoundException('Examen introuvable.');
    }
    if (!examen.enseignementId) {
      throw new BadRequestException('Cet examen n\'est rattaché à aucun enseignement.');
    }
    const enseignement = await this.prisma.enseignement.findUnique({ where: { id: examen.enseignementId } });
    if (!enseignement) {
      throw new NotFoundException('Enseignement introuvable pour cet examen.');
    }
    return { examen, enseignement };
  }

  private async resoudreCompteEnseignant(enseignement: { enseignantId: string | null }): Promise<number> {
    if (!enseignement.enseignantId) {
      throw new BadRequestException('Aucun enseignant n\'est associé à cet enseignement.');
    }
    const lastName = enseignement.enseignantId.replace(/^Professeur\s+/i, '').trim();
    if (!lastName) {
      throw new BadRequestException('Aucun enseignant n\'est associé à cet enseignement.');
    }
    const user = await this.prisma.user.findFirst({
      where: { lastName, role: { name: 'ENSEIGNANT' } },
      select: { id: true },
    });
    if (!user) {
      throw new BadRequestException('Aucun compte enseignant n\'est associé à cet examen.');
    }
    return user.id;
  }

  async creerMessage(examenId: string, contenu: string | undefined, context: AuthContext) {
    const { examen, enseignement } = await this.resoudreExamenEtEnseignement(examenId);
    const isScolarite = context.role === Role.SCOLARITE || context.role === Role.ADMINISTRATEUR;
    const isEnseignant = context.role === Role.ENSEIGNANT;

    let expediteurId: number;
    let destinataireId: number;

    if (isScolarite) {
      expediteurId = parseInt(context.userId, 10);
      destinataireId = await this.resoudreCompteEnseignant(enseignement);
    } else if (isEnseignant) {
      const userId = parseInt(context.userId, 10);
      let teacherId: number;
      try {
        teacherId = await this.resoudreCompteEnseignant(enseignement);
      } catch {
        throw new ForbiddenException('Accès interdit à cette conversation.');
      }
      if (teacherId !== userId) {
        throw new ForbiddenException('Vous ne pouvez pas répondre à ce message.');
      }
      // La réponse est adressée à l'expéditeur réel du dernier rappel Scolarité
      // de cette conversation (jamais au premier compte trouvé).
      const scolariteUsers = await this.prisma.user.findMany({
        where: { role: { name: 'CHEF_SCOLARITE' } },
        select: { id: true },
      });
      const scolariteIds = scolariteUsers.map((user) => user.id);
      if (!scolariteIds.length) {
        throw new NotFoundException('Compte Scolarité introuvable.');
      }
      const dernierRappel = await this.messages.findOne({
        where: { examenId, expediteurId: In(scolariteIds) },
        order: { createdAt: 'DESC' },
      });
      if (!dernierRappel) {
        throw new BadRequestException('Aucun rappel Scolarité n\'a été envoyé pour cet examen.');
      }
      expediteurId = userId;
      destinataireId = dernierRappel.expediteurId;
    } else {
      throw new ForbiddenException('Envoi de message interdit.');
    }

    const texte = (contenu ?? '').trim() || `Rappel : vos notes pour l'examen du ${examen.dateExamen} (salle ${examen.salle || '—'}) ne sont pas encore remises. Merci de les transmettre.`;

    const message = this.messages.create({ examenId, expediteurId, destinataireId, contenu: texte, estLu: false });
    const saved = await this.messages.save(message);
    const expediteur = await this.prisma.user.findUnique({ where: { id: expediteurId }, select: { role: { select: { name: true } } } });
    return { ...saved, expediteurRole: expediteur?.role?.name ?? null };
  }

  async listerMessages(examenId: string, context: AuthContext) {
    const { examen, enseignement } = await this.resoudreExamenEtEnseignement(examenId);
    await this.verifierAccesExamen(examen, enseignement, context);
    const messages = await this.messages.find({ where: { examenId }, order: { createdAt: 'ASC' } });

    // Enrichissement à la source : rôle réel de l'expéditeur (jamais déduit du contenu ni du statut lu).
    const expediteurIds = [...new Set(messages.map((message) => message.expediteurId))];
    const expediteurs = expediteurIds.length
      ? await this.prisma.user.findMany({ where: { id: { in: expediteurIds } }, select: { id: true, role: { select: { name: true } } } })
      : [];
    const roleParId = new Map(expediteurs.map((user) => [user.id, user.role?.name ?? null]));
    return messages.map((message) => ({ ...message, expediteurRole: roleParId.get(message.expediteurId) ?? null }));
  }

  async marquerLu(messageId: string, context: AuthContext) {
    const message = await this.messages.findOneBy({ id: messageId });
    if (!message) {
      throw new NotFoundException('Message introuvable.');
    }
    const userId = parseInt(context.userId, 10);
    const isScolarite = context.role === Role.SCOLARITE || context.role === Role.ADMINISTRATEUR;

    if (context.role === Role.RESPONSABLE_MENTION) {
      const { examen, enseignement } = await this.resoudreExamenEtEnseignement(message.examenId);
      await this.verifierAccesExamen(examen, enseignement, context);
    } else if (message.destinataireId !== userId) {
      throw new ForbiddenException('Seul le destinataire peut marquer ce message comme lu.');
    }

    if (!message.estLu) {
      message.estLu = true;
      await this.messages.save(message);
    }
    return message;
  }

  async compterNonLus(context: AuthContext) {
    const userId = parseInt(context.userId, 10);
    const count = await this.messages.count({ where: { destinataireId: userId, estLu: false } });
    return { count };
  }

  async listerConversations(context: AuthContext) {
    const userId = parseInt(context.userId, 10);
    const isScolarite = context.role === Role.SCOLARITE || context.role === Role.ADMINISTRATEUR;

    const examens = await this.findExamens(undefined, context);
    if (!examens.length) return [];

    const examenIds = examens.map((examen) => examen.id);
    const messages = await this.messages.find({
      where: { examenId: In(examenIds) },
      order: { createdAt: 'DESC' },
    });

    const groupes = new Map<string, { lastMessageAt: Date; unreadCount: number }>();
    for (const message of messages) {
      if (!groupes.has(message.examenId)) {
        groupes.set(message.examenId, { lastMessageAt: message.createdAt, unreadCount: 0 });
      }
      const groupe = groupes.get(message.examenId)!;
      if (message.createdAt > groupe.lastMessageAt) groupe.lastMessageAt = message.createdAt;
      if (message.destinataireId === userId && !message.estLu) groupe.unreadCount += 1;
    }

    const enseignementIds = [...new Set(examens.map((examen) => examen.enseignementId).filter(Boolean))] as string[];
    const enseignements = enseignementIds.length
      ? await this.prisma.enseignement.findMany({ where: { id: { in: enseignementIds } } })
      : [];
    const enseignementParId = new Map(enseignements.map((enseignement) => [enseignement.id, enseignement]));

    const conversations = examens
      .filter((examen) => groupes.has(examen.id))
      .map((examen) => {
        const groupe = groupes.get(examen.id)!;
        const enseignement = examen.enseignementId ? enseignementParId.get(examen.enseignementId) : null;
        return {
          examenId: examen.id,
          dateExamen: examen.dateExamen,
          salle: examen.salle,
          session: examen.session?.libelle ?? null,
          matiere: enseignement?.matiereId ?? null,
          enseignant: enseignement?.enseignantId ?? null,
          lastMessageAt: groupe.lastMessageAt,
          unreadCount: groupe.unreadCount,
        };
      });

    conversations.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    return conversations;
  }
}

