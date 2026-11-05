import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { QueryFailedError } from 'typeorm';

const DUPLICATE_MESSAGES: Record<string, string> = {
  mention: 'Une mention portant ce nom existe déjà.',
  cycle: 'Cette mention possède déjà un cycle de ce type.',
  niveau: 'Ce cycle possède déjà un niveau avec ce libellé.',
  annee_universitaire: 'Ce niveau possède déjà cette année universitaire.',
  semestre: 'Cette année universitaire possède déjà un semestre avec ce numéro.',
  matiere: 'Ce semestre possède déjà une matière portant ce nom.',
};

/**
 * Transforme les erreurs PostgreSQL en reponses HTTP claires :
 *  - 23505 (doublon)            -> 409
 *  - 23503 (cle etrangere)      -> 400
 */
@Catch(QueryFailedError)
export class DbExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const driver = exception.driverError as { code?: string; table?: string } | undefined;

    if (driver?.code === '23505') {
      return res.status(HttpStatus.CONFLICT).json({
        statusCode: 409,
        error: 'Conflict',
        message: DUPLICATE_MESSAGES[driver.table ?? ''] ?? 'Cet élément existe déjà.',
      });
    }

    if (driver?.code === '23503') {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: 400,
        error: 'Bad Request',
        message: "L'élément parent sélectionné n'existe pas (ou plus).",
      });
    }

    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Erreur interne de la base de données.',
    });
  }
}
