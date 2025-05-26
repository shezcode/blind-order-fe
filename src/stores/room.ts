import type { Player } from '@/lib/types';

import { defineStore } from 'pinia';
import { io, type Socket } from 'socket.io-client';

import { ref } from 'vue';

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
      roomSettings.value.numbersPerPlayer = room.numbersPerPlayer;
    });

    socket.on('room-deleted', (data: { reason: string }) => {
      console.log('Room deleted: ', data.reason);

      currentRoomId.value = '';
      currentPlayerName.value = '';
      players.value = [];
      isHost.value = false;
      hostId.value = '';

      roomDeletedCallback.value?.(data.reason);
    });

    socket.on('error', (message) => {
      console.error('Socket error: ', message);
    });
  };

  const roomDeletedCallback = ref<((reason: string) => void) | null>(null);

  //Actions
  const joinRoom = (roomId: string, playerName: string, asHost = false) => {
    currentRoomId.value = roomId;
    currentPlayerName.value = playerName;
    socket.emit('join-room', { roomId, playerName, isHost: asHost });
  };

  const leaveRoom = () => {
    if (currentRoomId.value) {
      socket.emit('leave-room', { roomId: currentRoomId.value });
    }

    currentRoomId.value = '';
    currentPlayerName.value = '';
    players.value = [];
    isHost.value = false;
    hostId.value = '';
  };

  const setRoomDeletedCallback = (callback: (reason: string) => void) => {
    roomDeletedCallback.value = callback;
  };

  return {
    //state
    connected,
    currentRoomId,
    currentPlayerName,
    players,
    roomSettings,
    hostId,
    isHost,
    //actions
    initializeSocket,
    joinRoom,
    leaveRoom,
    setRoomDeletedCallback,
  };
});
