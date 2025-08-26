import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PermissionGuard, RequireAdmin, RequireModerator } from '../../networking/permission.guard';

export interface Room {
  id: string;
  name: string;
  description: string;
  exits: { [direction: string]: string };
  npcs: string[];
  items: string[];
  players: string[];
  coordinates?: { x: number; y: number; z: number };
}

export interface NPC {
  id: string;
  name: string;
  description: string;
  location: string;
  template: string;
  dialogueTree?: string;
  stats: {
    health: number;
    level: number;
    aggression: 'friendly' | 'neutral' | 'hostile';
  };
}

export interface WorldSector {
  id: string;
  name: string;
  description: string;
  rooms: Room[];
  npcs: NPC[];
  items: any[];
}

@Controller('admin/world')
export class AdminWorldController {
  constructor() {}

  @Get('overview')
  @UseGuards(PermissionGuard)
  @RequireModerator()
  async getWorldOverview(): Promise<{
    totalRooms: number;
    totalNPCs: number;
    totalItems: number;
    activePlayers: number;
    sectors: WorldSector[];
  }> {
    // Mock world overview data
    // In a real implementation, this would integrate with the WorldManager
    const sectors: WorldSector[] = [
      {
        id: 'town',
        name: 'Town',
        description: 'The main town area with shops and residences',
        rooms: [
          {
            id: 'town_square',
            name: 'Town Square',
            description: 'A bustling town square with a fountain in the center',
            exits: { north: 'market_street', south: 'gate', east: 'bakery', west: 'blacksmith' },
            npcs: ['town_guard', 'merchant'],
            items: [],
            players: ['player1', 'player2'],
            coordinates: { x: 0, y: 0, z: 0 }
          },
          {
            id: 'blacksmith',
            name: 'Blacksmith Shop',
            description: 'A smithy with the sound of hammering metal',
            exits: { east: 'town_square' },
            npcs: ['blacksmith'],
            items: ['sword', 'armor'],
            players: [],
            coordinates: { x: -1, y: 0, z: 0 }
          }
        ],
        npcs: [
          {
            id: 'blacksmith',
            name: 'Grumpy the Blacksmith',
            description: 'A burly dwarf with a long beard',
            location: 'blacksmith',
            template: 'blacksmith_template',
            dialogueTree: 'blacksmith_dialogue',
            stats: { health: 100, level: 5, aggression: 'friendly' }
          }
        ],
        items: []
      }
    ];

    return {
      totalRooms: 25,
      totalNPCs: 15,
      totalItems: 50,
      activePlayers: 8,
      sectors
    };
  }

  @Get('rooms')
  @UseGuards(PermissionGuard)
  @RequireModerator()
  async getAllRooms(): Promise<Room[]> {
    // Mock rooms data
    return [
      {
        id: 'town_square',
        name: 'Town Square',
        description: 'A bustling town square with a fountain in the center',
        exits: { north: 'market_street', south: 'gate', east: 'bakery', west: 'blacksmith' },
        npcs: ['town_guard', 'merchant'],
        items: [],
        players: ['player1', 'player2'],
        coordinates: { x: 0, y: 0, z: 0 }
      },
      {
        id: 'blacksmith',
        name: 'Blacksmith Shop',
        description: 'A smithy with the sound of hammering metal',
        exits: { east: 'town_square' },
        npcs: ['blacksmith'],
        items: ['sword', 'armor'],
        players: [],
        coordinates: { x: -1, y: 0, z: 0 }
      }
    ];
  }

  @Get('rooms/:id')
  @UseGuards(PermissionGuard)
  @RequireModerator()
  async getRoom(@Param('id') roomId: string): Promise<Room | { error: string }> {
    // Mock room lookup
    const rooms: { [key: string]: Room } = {
      'town_square': {
        id: 'town_square',
        name: 'Town Square',
        description: 'A bustling town square with a fountain in the center',
        exits: { north: 'market_street', south: 'gate', east: 'bakery', west: 'blacksmith' },
        npcs: ['town_guard', 'merchant'],
        items: [],
        players: ['player1', 'player2'],
        coordinates: { x: 0, y: 0, z: 0 }
      }
    };

    const room = rooms[roomId];
    if (!room) {
      return { error: 'Room not found' };
    }
    return room;
  }

  @Post('rooms')
  @UseGuards(PermissionGuard)
  @RequireAdmin()
  async createRoom(@Body() roomData: Omit<Room, 'id'>): Promise<{ success: boolean; room?: Room; message: string }> {
    try {
      // Mock room creation
      const newRoom: Room = {
        id: `room_${Date.now()}`,
        ...roomData
      };

      return {
        success: true,
        room: newRoom,
        message: 'Room created successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create room'
      };
    }
  }

  @Put('rooms/:id')
  @UseGuards(PermissionGuard)
  @RequireAdmin()
  async updateRoom(@Param('id') roomId: string, @Body() roomData: Partial<Room>): Promise<{ success: boolean; room?: Room; message: string }> {
    try {
      // Mock room update
      const updatedRoom: Room = {
        id: roomId,
        name: roomData.name || 'Updated Room',
        description: roomData.description || 'Updated description',
        exits: roomData.exits || {},
        npcs: roomData.npcs || [],
        items: roomData.items || [],
        players: roomData.players || [],
        coordinates: roomData.coordinates || { x: 0, y: 0, z: 0 }
      };

      return {
        success: true,
        room: updatedRoom,
        message: 'Room updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update room'
      };
    }
  }

  @Delete('rooms/:id')
  @UseGuards(PermissionGuard)
  @RequireAdmin()
  async deleteRoom(@Param('id') roomId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Mock room deletion
      return {
        success: true,
        message: 'Room deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete room'
      };
    }
  }

  @Get('npcs')
  @UseGuards(PermissionGuard)
  @RequireModerator()
  async getAllNPCs(): Promise<NPC[]> {
    // Mock NPCs data
    return [
      {
        id: 'blacksmith',
        name: 'Grumpy the Blacksmith',
        description: 'A burly dwarf with a long beard',
        location: 'blacksmith',
        template: 'blacksmith_template',
        dialogueTree: 'blacksmith_dialogue',
        stats: { health: 100, level: 5, aggression: 'friendly' }
      },
      {
        id: 'town_guard',
        name: 'Town Guard',
        description: 'A vigilant guard protecting the town',
        location: 'town_square',
        template: 'guard_template',
        dialogueTree: 'guard_dialogue',
        stats: { health: 120, level: 8, aggression: 'neutral' }
      }
    ];
  }

  @Post('npcs/move')
  @UseGuards(PermissionGuard)
  @RequireAdmin()
  async moveNPC(@Body() moveData: { npcId: string; newLocation: string }): Promise<{ success: boolean; message: string }> {
    try {
      // Mock NPC movement
      return {
        success: true,
        message: `NPC moved to ${moveData.newLocation}`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to move NPC'
      };
    }
  }

  @Get('sectors')
  @UseGuards(PermissionGuard)
  @RequireModerator()
  async getWorldSectors(): Promise<WorldSector[]> {
    // Mock sectors data
    return [
      {
        id: 'town',
        name: 'Town',
        description: 'The main town area',
        rooms: [],
        npcs: [],
        items: []
      },
      {
        id: 'forest',
        name: 'Dark Forest',
        description: 'A mysterious and dangerous forest',
        rooms: [],
        npcs: [],
        items: []
      }
    ];
  }

  @Get('items')
  @UseGuards(PermissionGuard)
  @RequireModerator()
  async getAllItems(): Promise<any[]> {
    // Mock items data
    return [
      {
        id: 'sword',
        name: 'Iron Sword',
        description: 'A sturdy iron sword',
        type: 'weapon',
        value: 50
      },
      {
        id: 'armor',
        name: 'Leather Armor',
        description: 'Basic leather armor for protection',
        type: 'armor',
        value: 30
      },
      {
        id: 'potion',
        name: 'Health Potion',
        description: 'Restores health when consumed',
        type: 'consumable',
        value: 10
      }
    ];
  }

  @Post('items')
  @UseGuards(PermissionGuard)
  @RequireAdmin()
  async createItem(@Body() itemData: any): Promise<{ success: boolean; item?: any; message: string }> {
    try {
      // Mock item creation
      const newItem = {
        id: itemData.id || `item_${Date.now()}`,
        ...itemData
      };

      return {
        success: true,
        item: newItem,
        message: 'Item created successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create item'
      };
    }
  }

  @Post('items/move')
  @UseGuards(PermissionGuard)
  @RequireAdmin()
  async moveItem(@Body() moveData: { itemId: string; fromRoomId: string; toRoomId: string }): Promise<{ success: boolean; message: string }> {
    try {
      // Mock item movement
      return {
        success: true,
        message: `Item moved from ${moveData.fromRoomId} to ${moveData.toRoomId}`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to move item'
      };
    }
  }

  @Delete('items/:id')
  @UseGuards(PermissionGuard)
  @RequireAdmin()
  async deleteItem(@Param('id') itemId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Mock item deletion
      return {
        success: true,
        message: 'Item deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete item'
      };
    }
  }
}