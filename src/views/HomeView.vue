<template>
  <div class="home">
    <h1>BlindOrder</h1>

    <div class="lobby-actions">
      <router-link to="/create">
        <button>Create Room</button>
      </router-link>

      <div>
        <input v-model="joinRoomId" placeholder="Room Code" />
        <input v-model="playerName" placeholder="Your Name" />
        <button @click="joinRoom" :disabled="!canJoin">Join Room</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const joinRoomId = ref('');
const playerName = ref('');

const canJoin = computed(() => joinRoomId.value && playerName.value);

const joinRoom = () => {
  if (canJoin.value) {
    router.push(`/room/${joinRoomId.value}?name=${playerName.value}`);
  }
};
</script>
