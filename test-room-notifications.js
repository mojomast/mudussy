/**
 * Test script for room join notifications
 */

const { EngineService } = require('./engine/core/engine.service.ts');

// Mock the required modules to avoid complex dependencies
jest.mock('./engine/modules/networking/telnet-server.ts');
jest.mock('./engine/modules/world/world-manager.ts');
jest.mock('./engine/modules/persistence/player-manager.ts');

describe('Room Join Notifications', () => {
  let engineService;
  let mockTelnetServer;
  let mockWorldManager;
  let mockPlayerManager;

  beforeEach(async () => {
    // Create mocks
    mockTelnetServer = {
      sendMessage: jest.fn(),
      broadcastMessage: jest.fn(),
      getSessionManager: jest.fn(),
      getCommandParser: jest.fn(),
      getIsRunning: jest.fn().mockReturnValue(true)
    };

    mockWorldManager = {
      getPlayersInRoom: jest.fn(),
      movePlayer: jest.fn(),
      getRoom: jest.fn(),
      getAllRooms: jest.fn().mockReturnValue([])
    };

    mockPlayerManager = {
      getPlayerBySessionId: jest.fn(),
      getPlayerByUsername: jest.fn(),
      createPlayer: jest.fn(),
      addPlayer: jest.fn(),
      removePlayerBySessionId: jest.fn()
    };

    // Create engine service instance
    engineService = new EngineService();

    // Mock the internal components
    engineService.telnetServer = mockTelnetServer;
    engineService.worldManager = mockWorldManager;
    engineService.playerManager = mockPlayerManager;
  });

  test('should send notification when player enters room with other players', async () => {
    // Setup mock data
    const enteringPlayer = {
      username: 'TestPlayer',
      currentRoomId: 'room1',
      sessionId: 'session123'
    };

    const existingPlayer1 = { sessionId: 'session456' };
    const existingPlayer2 = { sessionId: 'session789' };

    // Mock the player manager to return the entering player
    mockPlayerManager.getPlayerBySessionId.mockReturnValue(enteringPlayer);

    // Mock the world manager to return existing players in the room
    mockWorldManager.getPlayersInRoom.mockReturnValue(['session456', 'session789', 'session123']);

    // Mock sendMessageToSession method
    engineService.sendMessageToSession = jest.fn();

    // Create a room entered event
    const roomEnteredEvent = {
      source: 'session123',
      data: {
        fromRoomId: 'room0',
        toRoomId: 'room1'
      }
    };

    // Call the handler
    await engineService.handleRoomEntered(roomEnteredEvent);

    // Verify that notifications were sent to the correct players
    expect(engineService.sendMessageToSession).toHaveBeenCalledTimes(2);
    expect(engineService.sendMessageToSession).toHaveBeenCalledWith('session456', expect.stringContaining('TestPlayer has entered the room'), 'info');
    expect(engineService.sendMessageToSession).toHaveBeenCalledWith('session789', expect.stringContaining('TestPlayer has entered the room'), 'info');

    // Verify that the entering player did NOT receive a notification
    expect(engineService.sendMessageToSession).not.toHaveBeenCalledWith('session123', expect.any(String), expect.any(String));
  });

  test('should not send notification when player enters empty room', async () => {
    // Setup mock data
    const enteringPlayer = {
      username: 'TestPlayer',
      currentRoomId: 'room1',
      sessionId: 'session123'
    };

    // Mock the player manager to return the entering player
    mockPlayerManager.getPlayerBySessionId.mockReturnValue(enteringPlayer);

    // Mock the world manager to return only the entering player in the room
    mockWorldManager.getPlayersInRoom.mockReturnValue(['session123']);

    // Mock sendMessageToSession method
    engineService.sendMessageToSession = jest.fn();

    // Create a room entered event
    const roomEnteredEvent = {
      source: 'session123',
      data: {
        fromRoomId: 'room0',
        toRoomId: 'room1'
      }
    };

    // Call the handler
    await engineService.handleRoomEntered(roomEnteredEvent);

    // Verify that no notifications were sent
    expect(engineService.sendMessageToSession).not.toHaveBeenCalled();
  });

  test('should handle invalid event data gracefully', async () => {
    // Mock sendMessageToSession method
    engineService.sendMessageToSession = jest.fn();

    // Create an invalid room entered event (missing data)
    const invalidEvent = {
      source: 'session123'
      // Missing data property
    };

    // Call the handler - should not throw and should not send notifications
    await expect(engineService.handleRoomEntered(invalidEvent)).resolves.toBeUndefined();
    expect(engineService.sendMessageToSession).not.toHaveBeenCalled();

    // Test with missing player
    mockPlayerManager.getPlayerBySessionId.mockReturnValue(null);
    const eventWithData = {
      source: 'session123',
      data: {
        fromRoomId: 'room0',
        toRoomId: 'room1'
      }
    };

    await expect(engineService.handleRoomEntered(eventWithData)).resolves.toBeUndefined();
    expect(engineService.sendMessageToSession).not.toHaveBeenCalled();
  });
});