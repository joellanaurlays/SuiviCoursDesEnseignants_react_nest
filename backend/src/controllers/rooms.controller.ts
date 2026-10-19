import { Router, Request, Response } from 'express';
import { RoomsService } from '../services/rooms.service';

export const roomsRouter = Router();
const roomsService = new RoomsService();

// GET /api/rooms - Récupère toutes les salles avec taux d'occupation
roomsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { typeSalle, statut, minCapacite } = req.query;
    const rooms = await roomsService.findAllRooms({
      typeSalle: typeSalle as string,
      statut: statut as string,
      minCapacite: minCapacite ? Number(minCapacite) : undefined
    });
    res.json(rooms);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/rooms/time-slots - Récupère les créneaux horaires EMIT
roomsRouter.get('/time-slots', async (_req: Request, res: Response) => {
  try {
    const slots = await roomsService.findAllTimeSlots();
    res.json(slots);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/rooms - Ajout d'une nouvelle salle
roomsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const created = await roomsService.createRoom(req.body);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/rooms/:id - Modification d'une salle
roomsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const updated = await roomsService.updateRoom(id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// PATCH /api/rooms/:id/toggle - Bascule d'état (Actif -> Maintenance -> Désactivé)
roomsRouter.patch('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const toggled = await roomsService.toggleRoomStatus(id);
    res.json(toggled);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// PATCH /api/rooms/time-slots/:id/toggle - Bascule d'activation d'un créneau
roomsRouter.patch('/time-slots/:id/toggle', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const slot = await roomsService.toggleTimeSlot(id, req.body);
    res.json(slot);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});
