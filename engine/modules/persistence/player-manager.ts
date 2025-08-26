/**
 * Player Manager - handles active player tracking and session management
 */

import { EventEmitter } from 'events';
import { GameEvent, EventSystem } from '../../core/event';
import { EventTypes } from '../../core/event';
import { Player } from './player';
import { IPlayer } from './types';

export class PlayerManager extends EventEmitter {
  private eventSystem: EventSystem;
  private logger: any;
  private activePlayers: Map<string, Player> = new Map(); // sessionId -> Player

  constructor(eventSystem: EventSystem, logger?: any) {
    super();
    this.eventSystem = eventSystem;
    this.logger = logger || console;
    this.setupEventHandlers();
  }

  /**
   * Set up event handlers
   */
  private setupEventHandlers(): void {
    // Listen for player join events
    this.eventSystem.on(EventTypes.PLAYER_JOINED, (event) => {
      this.logger.log(`Player joined: ${event.source}`);
    });

    // Listen for player leave events
    this.eventSystem.on(EventTypes.PLAYER_LEFT, (event) => {
      this.logger.log(`Player left: ${event.source}`);
      this.removePlayerBySessionId(event.source);
    });
  }

  /**
   * Add a player to the active players map
   */
  addPlayer(sessionId: string, player: Player): void {
    this.activePlayers.set(sessionId, player);
    this.logger.log(`Player added: ${player.username} (session: ${sessionId})`);

    // Emit player joined event
    this.eventSystem.emit(new GameEvent(
      EventTypes.PLAYER_JOINED,
      sessionId,
      undefined,
      { username: player.username, playerId: player.id }
    ));
  }

  /**
   * Get player by session ID
   */
  getPlayerBySessionId(sessionId: string): Player | undefined {
    return this.activePlayers.get(sessionId);
  }

  /**
   * Get player by username
   */
  getPlayerByUsername(username: string): Player | undefined {
    for (const player of this.activePlayers.values()) {
      if (player.username === username) {
        return player;
      }
    }
    return undefined;
  }

  /**
   * Get player by persistent player ID
   */
  getPlayerById(playerId: string): Player | undefined {
    for (const player of this.activePlayers.values()) {
      if (player.id === playerId) return player;
    }
    return undefined;
  }

  /**
   * Remove player by session ID
   */
  removePlayerBySessionId(sessionId: string): boolean {
    const player = this.activePlayers.get(sessionId);
    if (player) {
      this.activePlayers.delete(sessionId);
      this.logger.log(`Player removed: ${player.username} (session: ${sessionId})`);
      return true;
    }
    return false;
  }

  /**
   * Get all active players
   */
  getAllActivePlayers(): Player[] {
    return Array.from(this.activePlayers.values());
  }

  /**
   * Get all active session IDs
   */
  getAllActiveSessionIds(): string[] {
    return Array.from(this.activePlayers.keys());
  }

  /**
   * Check if a session has an active player
   */
  hasActivePlayer(sessionId: string): boolean {
    return this.activePlayers.has(sessionId);
  }

  /**
   * Get player count
   */
  getPlayerCount(): number {
    return this.activePlayers.size;
  }

  /**
   * Create a new player and add to active players
   */
  createPlayer(sessionId: string, username: string, initialRoomId: string = 'tavern'): Player {
    const player = new Player(username, sessionId, initialRoomId);
    this.addPlayer(sessionId, player);
    return player;
  }

  /**
   * Load player from save data and add to active players
   */
  loadPlayer(sessionId: string, playerData: any): Player {
    const player = Player.fromSaveData(playerData);
    player.sessionId = sessionId; // Update session ID for active session
    this.addPlayer(sessionId, player);
    return player;
  }

  /**
   * Get player statistics
   */
  getStatistics(): any {
    return {
      activePlayers: this.activePlayers.size,
      players: Array.from(this.activePlayers.values()).map(player => ({
        id: player.id,
        username: player.username,
        sessionId: player.sessionId,
        currentRoomId: player.currentRoomId,
        level: player.stats.level
      }))
    };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.activePlayers.clear();
    this.logger.log('Player manager cleaned up');
  }
}