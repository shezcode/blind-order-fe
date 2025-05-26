<template>
  <div class="room">
    <h1>Room: {{ roomStore.currentRoomId }}</h1>
    <p>Connected: {{ roomStore.connected }}</p>
    <p v-if="roomStore.isHost" class="host-badge">👑 You are the host</p>

    <div v-if="roomStore.players.length > 0">
      <p>Players ({{ roomStore.players.length }}):</p>
      <ul>
        <li v-for="player in roomStore.players" :key="player.id">
          {{ player.username }}
          <span v-if="player.id === roomStore.hostId">👑</span>
        </li>
      </ul>
    </div>

    <button @click="leaveRoom">Leave Room</button>
  </div>
</template>

<script setup lang="ts">
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

onUnmounted(() => {
  roomStore.setRoomDeletedCallback(() => {});
});
</script>

<style scoped>
.host-badge {
  color: #ffd700;
  font-weight: bold;
}
</style>
