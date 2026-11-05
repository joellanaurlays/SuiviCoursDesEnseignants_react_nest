import React, { useState, useMemo } from 'react';
import {
  Building2,
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Wrench,
  XCircle,
  Edit3,
  Trash2,
  Users,
  Cpu,
  Video,
  Wind,
  Volume2,
  CalendarDays,
  Percent
} from 'lucide-react';
import {
  CreneauHoraireEntity,
  CurrentUserSession,
  DayOfWeek,
  RoomStatus,
  RoomType,
  SalleEntity,
  SeancePlanifieeEntity
} from '../types/schedule';
import { ApiClient } from '../services/apiClient.ts';

interface RoomManagementViewProps {
  rooms: SalleEntity[];
  setRooms: React.Dispatch<React.SetStateAction<SalleEntity[]>>;
  timeSlots: CreneauHoraireEntity[];
  setTimeSlots: React.Dispatch<React.SetStateAction<CreneauHoraireEntity[]>>;
  sessions: SeancePlanifieeEntity[];
  currentUser: CurrentUserSession;
}

export const RoomManagementView: React.FC<RoomManagementViewProps> = ({
  rooms,
  setRooms,
  timeSlots,
  setTimeSlots,
  sessions,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'salles' | 'creneaux'>('salles');

  // Search & Filters for Rooms
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('TOUS');
  const [filterStatus, setFilterStatus] = useState<string>('TOUS');

  // Modal State for adding/editing a Room
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<SalleEntity | null>(null);

  // Form State
  const [roomName, setRoomName] = useState('');
  const [capacity, setCapacity] = useState(0);
  const [roomType, setRoomType] = useState<RoomType>('SALLE_TD');
  const [building, setBuilding] = useState('');
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [status, setStatus] = useState<RoomStatus>('ACTIF');
  const [notes, setNotes] = useState('');
  const [slotDay, setSlotDay] = useState<DayOfWeek>('Lundi');
  const [slotStart, setSlotStart] = useState('08:00');
  const [slotEnd, setSlotEnd] = useState('10:00');
  const [slotPeriod, setSlotPeriod] = useState<'Matin' | 'Apres-midi'>('Matin');
  const equipmentOptions = [...new Set([...rooms.flatMap(room => room.equipements), ...selectedEquipments])].sort();

  const handleCreateTimeSlot = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const created = await ApiClient.createTimeSlot({
        jourSemaine: slotDay, heureDebut: slotStart, heureFin: slotEnd,
        plage: slotPeriod, libelle: `${slotDay} ${slotStart}–${slotEnd}`, actif: true,
      });
      setTimeSlots(prev => [...prev, created].sort((a, b) => a.jourSemaine.localeCompare(b.jourSemaine) || a.heureDebut.localeCompare(b.heureDebut)));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Impossible de créer ce créneau.');
    }
  };

  const openAddModal = () => {
    setEditingRoom(null);
    setRoomName('');
    setCapacity(0);
    setRoomType('SALLE_TD');
    setBuilding('');
    setSelectedEquipments([]);
    setStatus('ACTIF');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (room: SalleEntity) => {
    setEditingRoom(room);
    setRoomName(room.nom);
    setCapacity(room.capacite);
    setRoomType(room.typeSalle);
    setBuilding(room.batiment);
    setSelectedEquipments(room.equipements);
    setStatus(room.statut);
    setNotes(room.remarques || '');
    setIsModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || !building.trim() || capacity < 1) return;

    const roomData = {
        nom: roomName,
        capacite: Number(capacity),
        typeSalle: roomType,
        batiment: building,
        equipements: selectedEquipments,
        statut: status,
        estDisponible: status === 'ACTIF',
        remarques: notes
    };
    try {
      const savedRoom = editingRoom
        ? await ApiClient.updateRoom(editingRoom.id, roomData)
        : await ApiClient.createRoom(roomData);
      setRooms(prev => editingRoom
        ? prev.map(room => room.id === savedRoom.id ? savedRoom : room)
        : [...prev, savedRoom]);
      setIsModalOpen(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Impossible d’enregistrer la salle.');
    }
  };

  const toggleRoomStatus = async (roomId: number) => {
    try {
      const updated = await ApiClient.toggleRoomStatus(roomId);
      setRooms(prev => prev.map(room => room.id === roomId ? updated : room));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Impossible de modifier la salle.');
    }
  };

  const toggleTimeSlot = async (slotId: number) => {
    const slot = timeSlots.find(item => item.id === slotId);
    if (!slot) return;
    try {
      const updated = await ApiClient.toggleTimeSlot(slotId, !slot.actif);
      setTimeSlots(prev => prev.map(item => item.id === slotId ? updated : item));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Impossible de modifier le créneau.');
    }
  };

  // Calculate room occupancy rate
  const totalSlotsCount = timeSlots.filter(s => s.actif).length;
  const getRoomOccupancy = (roomId: number) => {
    const bookedSessions = sessions.filter(s => s.salleId === roomId && s.statut !== 'ANNULE');
    if (totalSlotsCount === 0) return 0;
    return Math.round((bookedSessions.length / totalSlotsCount) * 100);
  };

  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      if (filterType !== 'TOUS' && r.typeSalle !== filterType) return false;
      if (filterStatus !== 'TOUS' && r.statut !== filterStatus) return false;
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const match = r.nom.toLowerCase().includes(q) || r.batiment.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [rooms, filterType, filterStatus, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Tab Switcher: Salles vs Créneaux (T21) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('salles')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'salles' ? 'bg-[#03045E] text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4 text-[#00B4D8]" />
            <span>Gestion des Salles ({rooms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('creneaux')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'creneaux' ? 'bg-[#03045E] text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4 text-[#00B4D8]" />
            <span>Grille des Créneaux Horaires ({timeSlots.length})</span>
          </button>
        </div>

        {activeTab === 'salles' && (currentUser.role === 'CHEF_SCOLARITE' || currentUser.role === 'ADMINISTRATEUR') && (
          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#0077B6] hover:bg-[#03045E] text-white text-xs font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une Salle</span>
          </button>
        )}
      </div>

      {/* VIEW 1: SALLES */}
      {activeTab === 'salles' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                id="room-search"
                name="rechercheSalle"
                aria-label="Rechercher une salle ou un bâtiment"
                type="text"
                placeholder="Rechercher salle, bâtiment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077B6]/30"
              />
            </div>

            <div>
              <select
                id="room-filter-type"
                name="typeSalle"
                aria-label="Filtrer par type de salle"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077B6]/30 font-medium text-slate-700"
              >
                <option value="TOUS">Tous les types de salle</option>
                <option value="AMPHI">Amphithéâtre</option>
                <option value="SALLE_TP">Salle TP Informatique</option>
                <option value="SALLE_TD">Salle TD</option>
                <option value="LABO">Laboratoire / Multimédia</option>
              </select>
            </div>

            <div>
              <select
                id="room-filter-status"
                name="statutSalle"
                aria-label="Filtrer par statut de salle"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077B6]/30 font-medium text-slate-700"
              >
                <option value="TOUS">Tous les statuts</option>
                <option value="ACTIF">Active (Disponible)</option>
                <option value="MAINTENANCE">En Maintenance</option>
                <option value="DESACTIVE">Désactivée</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredRooms.map(room => {
              const occupancy = getRoomOccupancy(room.id);
              return (
                <div
                  key={room.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#CAF0F8] text-[#03045E]">
                        {room.typeSalle}
                      </span>
                      <button
                        onClick={() => toggleRoomStatus(room.id)}
                        title="Changer le statut"
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          room.statut === 'ACTIF'
                            ? 'bg-emerald-100 text-emerald-800'
                            : room.statut === 'MAINTENANCE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {room.statut === 'ACTIF' && <CheckCircle className="w-2.5 h-2.5" />}
                        {room.statut === 'MAINTENANCE' && <Wrench className="w-2.5 h-2.5" />}
                        {room.statut === 'DESACTIVE' && <XCircle className="w-2.5 h-2.5" />}
                        <span>{room.statut}</span>
                      </button>
                    </div>

                    <h3 className="font-extrabold text-sm text-[#03045E] mt-2.5 leading-snug">
                      {room.nom}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">{room.batiment}</p>

                    <div className="mt-3 py-2 border-y border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-slate-700">
                        <Users className="w-3.5 h-3.5 text-[#0077B6]" />
                        <span className="font-bold">{room.capacite}</span> places
                      </div>

                      <div className="flex items-center gap-1 text-slate-600">
                        <Percent className="w-3 h-3 text-[#00B4D8]" />
                        <span>Occup. : <strong className="text-[#03045E]">{occupancy}%</strong></span>
                      </div>
                    </div>

                    {/* Progress bar of occupancy */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${occupancy > 75 ? 'bg-amber-500' : 'bg-[#0077B6]'}`}
                        style={{ width: `${Math.min(occupancy, 100)}%` }}
                      />
                    </div>

                    {/* Equipments Tags */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {room.equipements.slice(0, 3).map((eq, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {eq}
                        </span>
                      ))}
                      {room.equipements.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 font-bold">
                          +{room.equipements.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    {(currentUser.role === 'CHEF_SCOLARITE' || currentUser.role === 'ADMINISTRATEUR') ? (
                      <>
                        <button
                          onClick={() => openEditModal(room)}
                          className="text-[#0077B6] hover:text-[#03045E] font-bold flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Modifier</span>
                        </button>
                        <button
                          onClick={() => toggleRoomStatus(room.id)}
                          className="text-slate-500 hover:text-slate-700 text-[11px]"
                        >
                          Changer état
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-400">Consultation seule</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: CRÉNEAUX HORAIRES */}
      {activeTab === 'creneaux' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-[#03045E] text-base">Configuration des Plages & Créneaux Horaires</h3>
                <p className="text-xs text-slate-500">
                  Découpage officiel des séances à l'EMIT (Matin : 08h-10h, 10h15-12h15 | Après-midi : 13h30-15h30, 15h45-17h45).
                </p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-[#CAF0F8] text-[#0077B6] font-semibold">
                Blocs de 2h
              </span>
            </div>

            <div className="overflow-x-auto">
              {(currentUser.role === 'CHEF_SCOLARITE' || currentUser.role === 'ADMINISTRATEUR') && (
                <form onSubmit={handleCreateTimeSlot} className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-5">
                  <select id="slot-day" name="jourSemaine" aria-label="Jour du créneau" value={slotDay} onChange={event => setSlotDay(event.target.value as DayOfWeek)} className="rounded-lg border border-slate-200 px-2 py-2 text-xs">
                    {(['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] as DayOfWeek[]).map(day => <option key={day}>{day}</option>)}
                  </select>
                  <input id="slot-start" name="heureDebut" aria-label="Heure de début" type="time" required value={slotStart} onChange={event => setSlotStart(event.target.value)} className="rounded-lg border border-slate-200 px-2 py-2 text-xs" />
                  <input id="slot-end" name="heureFin" aria-label="Heure de fin" type="time" required value={slotEnd} onChange={event => setSlotEnd(event.target.value)} className="rounded-lg border border-slate-200 px-2 py-2 text-xs" />
                  <select id="slot-period" name="periode" aria-label="Période" value={slotPeriod} onChange={event => setSlotPeriod(event.target.value as 'Matin' | 'Apres-midi')} className="rounded-lg border border-slate-200 px-2 py-2 text-xs">
                    <option>Matin</option><option>Apres-midi</option>
                  </select>
                  <button type="submit" className="rounded-lg bg-[#0077B6] px-3 py-2 text-xs font-bold text-white">Ajouter un créneau</button>
                </form>
              )}
              <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#03045E] text-white">
                  <tr>
                    <th className="py-2.5 px-4 font-bold">ID</th>
                    <th className="py-2.5 px-4 font-bold">Jour</th>
                    <th className="py-2.5 px-4 font-bold">Plage</th>
                    <th className="py-2.5 px-4 font-bold">Début</th>
                    <th className="py-2.5 px-4 font-bold">Fin</th>
                    <th className="py-2.5 px-4 font-bold">Durée</th>
                    <th className="py-2.5 px-4 font-bold">Statut</th>
                    <th className="py-2.5 px-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timeSlots.map(slot => (
                    <tr key={slot.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-500">#{slot.id}</td>
                      <td className="py-2.5 px-4 font-bold text-[#03045E]">{slot.jourSemaine}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${slot.plage === 'Matin' ? 'bg-amber-100 text-amber-800' : 'bg-emit-ice text-emit-navy'}`}>
                          {slot.plage}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{slot.heureDebut}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{slot.heureFin}</td>
                      <td className="py-2.5 px-4 text-slate-500">{slot.dureeMinutes} min ({Math.floor(slot.dureeMinutes / 60)}h{String(slot.dureeMinutes % 60).padStart(2, '0')})</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${slot.actif ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                          {slot.actif ? 'Actif' : 'Désactivé'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {(currentUser.role === 'CHEF_SCOLARITE' || currentUser.role === 'ADMINISTRATEUR') && (
                          <button
                            onClick={() => toggleTimeSlot(slot.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                          >
                            {slot.actif ? 'Désactiver' : 'Activer'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT ROOM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#03045E]">
                {editingRoom ? `Modifier la Salle : ${editingRoom.nom}` : 'Ajouter une Nouvelle Salle'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="py-4 space-y-4 text-xs">
              <div>
                <label htmlFor="room-name" className="block text-xs font-bold text-slate-700 mb-1">Nom du Local / Salle *</label>
                <input
                  id="room-name"
                  name="nom"
                  type="text"
                  required
                  placeholder="Ex: Amphithéâtre C, Salle Machine 3..."
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077B6]/30 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="room-capacity" className="block text-xs font-bold text-slate-700 mb-1">Capacité (Places assises) *</label>
                  <input
                    id="room-capacity"
                    name="capacite"
                    type="number"
                    min="10"
                    max="500"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077B6]/30 font-medium"
                  />
                </div>

                <div>
                  <label htmlFor="room-type" className="block text-xs font-bold text-slate-700 mb-1">Type de Salle *</label>
                  <select
                    id="room-type"
                    name="typeSalle"
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value as RoomType)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077B6]/30 font-medium"
                  >
                    <option value="AMPHI">Amphithéâtre (AMPHI)</option>
                    <option value="SALLE_TP">Salle Machine (TP)</option>
                    <option value="SALLE_TD">Salle Cours / TD</option>
                    <option value="LABO">Laboratoire / Studio (LABO)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="room-building" className="block text-xs font-bold text-slate-700 mb-1">Bâtiment / Emplacement</label>
                  <input
                    id="room-building"
                    name="batiment"
                    type="text"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077B6]/30"
                  />
                </div>

                <div>
                  <label htmlFor="room-status" className="block text-xs font-bold text-slate-700 mb-1">Statut Initial</label>
                  <select
                    id="room-status"
                    name="statut"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as RoomStatus)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077B6]/30 font-medium"
                  >
                    <option value="ACTIF">Active (Opérationnelle)</option>
                    <option value="MAINTENANCE">En Maintenance</option>
                    <option value="DESACTIVE">Désactivée</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Équipements Disponibles</label>
                <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 max-h-32 overflow-y-auto">
                  {equipmentOptions.map(eq => (
                    <label key={eq} className="flex items-center space-x-2 text-[11px] text-slate-700 cursor-pointer">
                      <input
                        id={`room-equipment-${eq.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                        name="equipements"
                        type="checkbox"
                        checked={selectedEquipments.includes(eq)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEquipments(prev => [...prev, eq]);
                          } else {
                            setSelectedEquipments(prev => prev.filter(x => x !== eq));
                          }
                        }}
                        className="rounded text-[#0077B6] focus:ring-[#0077B6]"
                      />
                      <span>{eq}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#03045E] hover:bg-[#0077B6] text-white font-bold transition shadow-md"
                >
                  {editingRoom ? 'Enregistrer les modifications' : 'Créer la salle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
