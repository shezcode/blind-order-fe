<template>
  <div class="space-y-6">
    <!-- Game Status Bar -->
    <div class="bg-card border border-border rounded-lg p-4 shadow-sm">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <span class="text-sm font-medium text-foreground">Lives:</span>
            <div class="flex space-x-1">
              <div
                v-for="i in gameState.maxLives"
                :key="i"
                :class="[
                  'w-6 h-6 rounded-full border-2',
                  i <= gameState.lives
                    ? 'bg-red-500 border-red-500'
                    : 'bg-muted border-muted-foreground',
                ]"
              />
            </div>
          </div>

          <div class="text-sm text-muted-foreground">Progress: {{ gameState.progress }}%</div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="w-full bg-muted rounded-full h-2">
        <div
          class="bg-primary h-2 rounded-full transition-all duration-300"
          :style="{ width: `${gameState.progress}%` }"
        />
      </div>
    </div>

    <!-- Game State Messages -->
    <div
      v-if="gameState.state === 'victory'"
      class="bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-4"
    >
      <div class="text-center">
        <div class="text-2xl mb-2">🎉</div>
        <h3 class="text-lg font-semibold text-green-800 dark:text-green-200">Victory!</h3>
        <p class="text-green-700 dark:text-green-300">You successfully completed the sequence!</p>
      </div>
    </div>

    <div
      v-else-if="gameState.state === 'game-over'"
      class="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-4"
    >
      <div class="text-center">
        <div class="text-2xl mb-2">💀</div>
        <h3 class="text-lg font-semibold text-red-800 dark:text-red-200">Game Over</h3>
        <p class="text-red-700 dark:text-red-300">You ran out of lives!</p>
      </div>
    </div>

    <!-- Player's Numbers -->
    <div class="bg-card border border-border rounded-lg p-6 shadow-sm">
      <h3 class="text-lg font-semibold text-foreground mb-4">Your Numbers</h3>

      <div v-if="currentPlayerNumbers.length > 0" class="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <Button
          v-for="number in currentPlayerNumbers"
          :key="number"
          variant="outline"
          :disabled="gameState.state !== 'playing'"
          @click="playNumber(number)"
          class="h-16 text-lg font-bold transition-all hover:bg-primary hover:text-primary-foreground"
          :class="{
            'opacity-50': gameState.state !== 'playing',
          }"
        >
          {{ number }}
        </Button>
      </div>

      <div v-else class="text-center py-8 text-muted-foreground">
        <span v-if="gameState.state === 'victory'">🎉 All numbers played!</span>
        <span v-else>No numbers remaining</span>
      </div>
    </div>

    <!-- Timeline -->
    <div class="bg-card border border-border rounded-lg p-6 shadow-sm">
      <h3 class="text-lg font-semibold text-foreground mb-4">
        Timeline ({{ gameState.timeline.length }} played)
      </h3>

      <div v-if="gameState.timeline.length > 0" class="space-y-2">
        <div class="flex flex-wrap gap-2">
          <div
            v-for="(number, index) in gameState.timeline"
            :key="index"
            class="inline-flex items-center justify-center w-10 h-10 bg-primary/10 text-primary font-bold rounded-md text-sm"
          >
            {{ number }}
          </div>
        </div>
      </div>

      <div v-else class="text-center py-4 text-muted-foreground">No numbers played yet</div>
    </div>

    <!-- Game Events Feed -->
    <div class="bg-card border border-border rounded-lg p-6 shadow-sm">
      <h3 class="text-lg font-semibold text-foreground mb-4">Game Feed</h3>

      <div class="space-y-2 max-h-32 overflow-y-auto">
        <div
          v-for="event in recentEvents"
          :key="event.timestamp"
          :class="['text-sm p-2 rounded', getEventStyling(event.type)]"
        >
          {{ formatEvent(event) }}
        </div>
      </div>

      <div
        v-if="(props.gameState.gameEvents || []).length === 0"
        class="text-center py-4 text-muted-foreground text-sm"
      >
        Game events will appear here
      </div>
    </div>

    <!-- Host Controls -->
    <div
      v-if="isHost && (gameState.state === 'game-over' || gameState.state === 'victory')"
      class="bg-card border border-border rounded-lg p-6 shadow-sm"
    >
      <h3 class="text-lg font-semibold text-foreground mb-4">Host Controls</h3>
      <div class="flex space-x-3">
        <Button @click="resetGame" variant="outline" class="flex-1"> Play Again </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { computed } from 'vue';
import type { GameEvent } from '@/stores/room';

interface Props {
  gameState: any;
  currentPlayerNumbers: number[];
  isHost: boolean;
  canPlayNumber: (number: number) => boolean;
  playNumber: (number: number) => void;
  resetGame: () => void;
}

const props = defineProps<Props>();

const recentEvents = computed(() => {
  return (props.gameState.gameEvents || []).slice(-5).reverse();
});

const getEventStyling = (eventType: string) => {
  switch (eventType) {
    case 'move-made':
      return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200';
    case 'move-failed':
      return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200';
    case 'game-started':
      return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200';
    case 'game-ended':
      return 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200';
    case 'game-reset':
      return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200';
    default:
      return 'bg-muted/20 text-muted-foreground';
  }
};

const formatEvent = (event: GameEvent) => {
  switch (event.type) {
    case 'move-made':
      return `${event.data.playerName} played ${event.data.number}`;
    case 'move-failed':
      return `${event.data.playerName || 'Someone'} played ${event.data.number} - ${event.data.error}`;
    case 'game-started':
      return event.data.message;
    case 'game-ended':
      return event.data.message;
    case 'game-reset':
      return event.data.message;
    default:
      return 'Unknown event';
  }
};
</script>
