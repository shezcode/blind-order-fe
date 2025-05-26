<template>
  <div class="home">
    <h1>BlindOrder</h1>

    <div class="lobby-actions">
      <router-link to="/create">
        <Button variant="outline" class="hover:cursor-pointer">Create Room</Button>
      </router-link>

      <div>
        <Input v-model="joinRoomId" placeholder="Room Code" />
        <Input v-model="playerName" placeholder="Your Name" />
        <Button
          class="hover:cursor-pointer"
          variant="outline"
          @click="joinRoom"
          :disabled="!canJoin"
          >Join Room</Button
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
