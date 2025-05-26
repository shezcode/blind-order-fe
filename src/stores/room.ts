import type { Player } from '@/lib/types';

import { defineStore } from 'pinia';
import { io, type Socket } from 'socket.io-client';

import { ref } from 'vue';

export interface GameState {
  state: 'lobby' | 'playing' | 'game-over' | 'victory';
  lives: number;
  maxLives: number;
  timeline: number[];
  progress: number;
  remainingNumbers: number[];
  gameEvents: GameEvent[];
}

export interface GameMove {
  playerId: string;
  playerName: string;
  number: number;
  timeline: number[];
}

export interface GameEvent {
  type: 'move-made' | 'move-failed' | 'game-started' | 'game-ended' | 'game-reset';
  data: any;
  timestamp: number;
}

export const useRoomStore = defineStore('room', () => {
  const socket: Socket = io('http://localhost:3001');

  const connected = ref(false);
  const currentRoomId = ref('');
  const currentPlayerName = ref('');
  const players = ref<Player[]>([]);
  const isHost = ref(false);
  const hostId = ref('');

  const roomSettings = ref({
    lives: 3,
    maxLives: 3,
    numbersPerPlayer: 6,
  });

  // Game state
  const gameState = ref<GameState>({
    state: 'lobby',
    lives: 3,
    maxLives: 3,
    timeline: [],
    progress: 0,
    remainingNumbers: [],
    gameEvents: [],
  });

  const currentPlayerNumbers = ref<number[]>([]);

  const initializeSocket = () => {
    socket.on('connect', () => {
      connected.value = true;
    });

    socket.on('room-updated', (room) => {
      players.value = room.players || [];
      hostId.value = room.hostId;
      isHost.value = room.hostId === socket.id;
      roomSettings.value.lives = room.lives;
      roomSettings.value.maxLives = room.maxLives;
      roomSettings.value.numbersPerPlayer = room.numbersPerPlayer || 6;

      // Update current player's numbers
      const currentPlayer = room.players?.find((p: Player) => p.id === socket.id);
      if (currentPlayer) {
        currentPlayerNumbers.value = currentPlayer.numbers || [];
      }
    });

    socket.on('game-state-updated', (newGameState: GameState) => {
      gameState.value = { ...newGameState };
    });

    socket.on('room-deleted', (data: { reason: string }) => {
      console.log('Room deleted: ', data.reason);
      resetRoomState();
      roomDeletedCallback.value?.(data.reason);
    });

    socket.on('error', (message) => {
      console.error('Socket error: ', message);
      addGameEvent({
        type: 'move-failed',
        data: { error: message },
        timestamp: Date.now(),
      });
    });
  };

  const roomDeletedCallback = ref<((reason: string) => void) | null>(null);

  const addGameEvent = (event: GameEvent) => {
    gameEvents.value.push(event);
    // Keep only last 50 events to prevent memory issues
    if (gameEvents.value.length > 50) {
      gameEvents.value = gameEvents.value.slice(-50);
    }
  };

  const resetRoomState = () => {
    currentRoomId.value = '';
    currentPlayerName.value = '';
    players.value = [];
    isHost.value = false;
    hostId.value = '';
    currentPlayerNumbers.value = [];
    gameEvents.value = [];
    gameState.value = {
      state: 'lobby',
      lives: 3,
      maxLives: 3,
      timeline: [],
      nextExpected: -1,
      progress: 0,
      remainingNumbers: [],
    };
  };

  // Actions
  const joinRoom = (roomId: string, playerName: string, asHost = false) => {
    currentRoomId.value = roomId;
    currentPlayerName.value = playerName;
    socket.emit('join-room', { roomId, playerName, isHost: asHost });
  };

  const leaveRoom = () => {
    if (currentRoomId.value) {
      socket.emit('leave-room', { roomId: currentRoomId.value });
    }
    resetRoomState();
  };

  const startGame = () => {
    if (isHost.value && currentRoomId.value) {
      socket.emit('start-game', { roomId: currentRoomId.value });
    }
  };

  const playNumber = (number: number) => {
    if (currentRoomId.value && gameState.value.state === 'playing') {
      socket.emit('play-number', { roomId: currentRoomId.value, number });
    }
  };

  const resetGame = () => {
    if (isHost.value && currentRoomId.value) {
      socket.emit('reset-game', { roomId: currentRoomId.value });
    }
  };

  const setRoomDeletedCallback = (callback: (reason: string) => void) => {
    roomDeletedCallback.value = callback;
  };

  // Computed helpers
  const canStartGame = () => {
    return isHost.value && players.value.length >= 2 && gameState.value.state === 'lobby';
  };

  const isGameInProgress = () => {
    return gameState.value.state === 'playing';
  };

  const isGameOver = () => {
    return gameState.value.state === 'game-over' || gameState.value.state === 'victory';
  };

  const canPlayNumber = (number: number) => {
    return gameState.value.state === 'playing' && currentPlayerNumbers.value.includes(number);
  };

  return {
    // State
    connected,
    currentRoomId,
    currentPlayerName,
    players,
    roomSettings,
    hostId,
    isHost,
    gameState,
    currentPlayerNumbers,

    // Actions
    initializeSocket,
    joinRoom,
    leaveRoom,
    startGame,
    playNumber,
    resetGame,
    setRoomDeletedCallback,

    // Helpers
    canStartGame,
    isGameInProgress,
    isGameOver,
    canPlayNumber,
  };
});
