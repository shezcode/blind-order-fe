<template>
  <div class="min-h-screen bg-background p-4">
    <div class="max-w-2xl mx-auto space-y-6">
      <!-- Header -->
      <div class="bg-card border border-border rounded-lg p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-2xl font-bold text-foreground">Room {{ roomStore.currentRoomId }}</h1>
            <div class="flex items-center space-x-2 mt-1">
              <div class="flex items-center space-x-1">
                <div
                  :class="[
                    'w-2 h-2 rounded-full',
                    roomStore.connected ? 'bg-green-500' : 'bg-red-500',
                  ]"
                />
                <span class="text-sm text-muted-foreground">
                  {{ roomStore.connected ? 'Connected' : 'Disconnected' }}
                </span>
              </div>
            </div>
          </div>

          <Button variant="outline" @click="copyRoomCode" class="text-xs"> Copy Code </Button>
        </div>

        <!-- Host Badge -->
        <div
          v-if="roomStore.isHost"
          class="inline-flex items-center space-x-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-md text-sm font-medium"
        >
          <span>👑</span>
          <span>You are the host</span>
        </div>
      </div>

      <!-- Game Settings -->
      <div class="bg-card border border-border rounded-lg p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-foreground mb-4">Game Settings</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="text-center p-3 bg-muted/30 rounded-md">
            <div class="text-2xl font-bold text-foreground">{{ roomStore.roomSettings.lives }}</div>
            <div class="text-sm text-muted-foreground">Lives</div>
          </div>
          <div class="text-center p-3 bg-muted/30 rounded-md">
            <div class="text-2xl font-bold text-foreground">
              {{ roomStore.roomSettings.numbersPerPlayer }}
            </div>
            <div class="text-sm text-muted-foreground">Numbers</div>
          </div>
          <div class="text-center p-3 bg-muted/30 rounded-md">
            <div class="text-2xl font-bold text-foreground">{{ roomStore.players.length }}</div>
            <div class="text-sm text-muted-foreground">Players</div>
          </div>
        </div>
      </div>

      <!-- Players List -->
      <div class="bg-card border border-border rounded-lg p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-foreground">
            Players ({{ roomStore.players.length }})
          </h2>
        </div>

        <div v-if="roomStore.players.length > 0" class="space-y-3">
          <div
            v-for="player in roomStore.players"
            :key="player.id"
            class="flex items-center justify-between p-3 bg-muted/20 rounded-md border"
          >
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span class="text-sm font-medium text-primary">
                  {{ player.username.charAt(0).toUpperCase() }}
                </span>
              </div>
              <span class="font-medium text-foreground">{{ player.username }}</span>
            </div>

            <div class="flex items-center space-x-2">
              <span v-if="player.id === roomStore.hostId" class="text-yellow-500">👑</span>
              <span
                v-if="player.id === roomStore.currentPlayerName"
                class="text-xs bg-primary/20 text-primary px-2 py-1 rounded"
              >
                You
              </span>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-muted-foreground">
          <p>No players in room yet...</p>
          <p class="text-sm mt-1">Share the room code to invite others!</p>
        </div>
      </div>

      <!-- Game Interface or Lobby -->
      <div v-if="roomStore.isGameInProgress() || roomStore.isGameOver()">
        <GameInterface
          :game-state="roomStore.gameState"
          :current-player-numbers="roomStore.currentPlayerNumbers"
          :is-host="roomStore.isHost"
          :can-play-number="roomStore.canPlayNumber"
          :play-number="roomStore.playNumber"
          :reset-game="roomStore.resetGame"
        />
      </div>

      <!-- Lobby Status -->
      <div v-else class="bg-card border border-border rounded-lg p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-foreground mb-4">Game Status</h2>
        <div class="text-center py-6">
          <div class="text-muted-foreground mb-4">
            <span
              class="inline-block w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center mb-2"
            >
              ⏳
            </span>
            <p>Waiting for players to join...</p>
          </div>

          <div v-if="roomStore.canStartGame()" class="space-y-3">
            <p class="text-sm text-muted-foreground">Ready to start the game?</p>
            <Button size="lg" class="w-full sm:w-auto" @click="roomStore.startGame">
              Start Game
            </Button>
          </div>

          <div v-else-if="roomStore.players.length < 2" class="text-sm text-muted-foreground">
            Need at least 2 players to start
          </div>

          <div v-else-if="!roomStore.isHost" class="text-sm text-muted-foreground">
            Waiting for host to start the game
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" @click="leaveRoom" class="flex-1"> Leave Room </Button>

        <Button variant="outline" @click="shareRoom" class="flex-1"> Share Room </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import GameInterface from '@/components/GameInterface.vue';
import { onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRoomStore } from '../stores/room';

const route = useRoute();
const router = useRouter();
const roomStore = useRoomStore();

onMounted(() => {
  roomStore.initializeSocket();

  const roomId = route.params.id as string;
  const playerName = route.query.name as string;
  const asHost = route.query.host === 'true';

  if (roomId && playerName) {
    roomStore.joinRoom(roomId, playerName, asHost);
  }

  // Handle room deletion
  roomStore.setRoomDeletedCallback((reason: string) => {
    alert(`Room was deleted: ${reason}`);
    router.push('/');
  });
});

const leaveRoom = () => {
  roomStore.leaveRoom();
  router.push('/');
};

const copyRoomCode = async () => {
  try {
    await navigator.clipboard.writeText(roomStore.currentRoomId);
    // You might want to show a toast notification here
    console.log('Room code copied to clipboard');
  } catch (err) {
    console.error('Failed to copy room code:', err);
  }
};

const shareRoom = async () => {
  const shareData = {
    title: 'BlindOrder Game',
    text: `Join my BlindOrder game! Room code: ${roomStore.currentRoomId}`,
    url: window.location.href,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      // Fallback to copying URL
      await navigator.clipboard.writeText(window.location.href);
      console.log('Room URL copied to clipboard');
    }
  } catch (err) {
    console.error('Error sharing:', err);
  }
};

onUnmounted(() => {
  roomStore.setRoomDeletedCallback(() => {});
});
</script>
