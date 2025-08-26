import { Module } from '@nestjs/common';
import { EventSystem } from '../../engine/core/event';
import { TelnetServer } from '../../engine/modules/networking/telnet-server';
import { INetworkConfig } from '../../engine/modules/networking/types';
import { WorldManager, IWorldConfig } from '../../engine/modules/world';
import { PlayerManager } from '../../engine/modules/persistence/player-manager';

@Module({
  providers: [
    {
      provide: EventSystem,
      useFactory: () => new EventSystem(),
    },
    {
      provide: WorldManager,
      useFactory: async (eventSystem: EventSystem) => {
        // Basic world setup mirroring EngineService defaults
        const worldConfig: IWorldConfig = {
          contentPath: './engine/modules/world/content',
          defaultRoomId: 'tavern',
          maxItemsPerRoom: 50,
          maxPlayersPerRoom: 10,
          allowRoomCreation: false,
        };

        const world = new WorldManager(eventSystem, worldConfig);
        try {
          await world.loadWorld();
        } catch (e) {
          // Continue even if world fails to load; commands can still function
          // console.warn('World load failed in EngineModule:', e);
        }
        return world;
      },
      inject: [EventSystem],
    },
    {
      provide: PlayerManager,
      useFactory: (eventSystem: EventSystem) => new PlayerManager(eventSystem, console),
      inject: [EventSystem],
    },
    {
  provide: TelnetServer,
  useFactory: (eventSystem: EventSystem, playerManager: PlayerManager, worldManager: WorldManager) => {
        const config: INetworkConfig = {
          host: 'localhost',
          port: 4000,
          maxConnections: 100,
          connectionTimeout: 30000,
          idleTimeout: 300000, // 5 minutes
          rateLimitWindow: 60000, // 1 minute
          rateLimitMaxRequests: 10,
          enableLogging: true,
          logLevel: 'info',
        };
        // Pass playerManager so movement/chat/etc. can leverage it
  return new TelnetServer(eventSystem, config, playerManager, console, worldManager);
      },
      inject: [EventSystem, PlayerManager, WorldManager],
    },
  ],
  exports: [EventSystem, TelnetServer, WorldManager, PlayerManager],
})
export class EngineModule {}