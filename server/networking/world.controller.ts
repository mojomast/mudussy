import { Controller, Get, Param } from '@nestjs/common';
import { WorldManager } from '../../engine/modules/world/world-manager';
import { PlayerManager } from '../../engine/modules/persistence/player-manager';

export interface WorldData {
  name: string;
  description: string;
  rooms: RoomData[];
  players: PlayerData[];
}

export interface RoomData {
  id: string;
  name: string;
  description: string;
  exits: string[];
  players: string[];
}

export interface PlayerData {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline';
}

@Controller('world')
export class WorldController {
  constructor(
    private readonly worldManager: WorldManager,
    private readonly playerManager: PlayerManager,
  ) {}

  @Get()
  async getWorldData(): Promise<WorldData> {
    const rooms = this.worldManager.getAllRooms().map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      exits: r.exits.map(e => e.direction),
      players: r.players,
    }));

    const players = this.playerManager.getAllActivePlayers().map(p => ({
      id: p.sessionId,
      name: p.username,
      location: p.currentRoomId,
      status: 'online' as const,
    }));

    return {
      name: 'MUD Engine World',
      description: 'Live world data',
      rooms,
      players,
    };
  }

  @Get('rooms')
  async getRooms(): Promise<RoomData[]> {
    return this.worldManager.getAllRooms().map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      exits: r.exits.map(e => e.direction),
      players: r.players,
    }));
  }

  @Get('rooms/:id')
  async getRoom(@Param('id') roomId: string): Promise<RoomData | { error: string }> {
    const room = this.worldManager.getRoom(roomId);
    if (!room) return { error: 'Room not found' };
    return {
      id: room.id,
      name: room.name,
      description: room.description,
      exits: room.exits.map(e => e.direction),
      players: room.players,
    };
  }

  @Get('players')
  async getPlayers(): Promise<PlayerData[]> {
    return this.playerManager.getAllActivePlayers().map(p => ({
      id: p.sessionId,
      name: p.username,
      location: p.currentRoomId,
      status: 'online' as const,
    }));
  }

  @Get('players/:id')
  async getPlayer(@Param('id') playerId: string): Promise<PlayerData | { error: string }> {
    const player = this.playerManager.getAllActivePlayers().find(p => p.sessionId === playerId);
    if (!player) return { error: 'Player not found' };
    return {
      id: player.sessionId,
      name: player.username,
      location: player.currentRoomId,
      status: 'online',
    };
  }

  @Get('stats')
  async getWorldStats(): Promise<{
    totalPlayers: number;
    activePlayers: number;
    totalRooms: number;
    uptime: string;
  }> {
    const players = this.playerManager.getPlayerCount();
    const rooms = this.worldManager.getAllRooms().length;
    return {
      totalPlayers: players,
      activePlayers: players,
      totalRooms: rooms,
      uptime: 'unknown',
    };
  }
}