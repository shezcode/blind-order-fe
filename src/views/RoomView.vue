<template>
  <div class="room">
    <h1>Room: {{ roomId }}</h1>
    <p>Connected: {{ connected }}</p>

    <div v-if="players.length > 0">
      <p>
        Players ({{ players.length }}):
        <span v-for="(player, index) in players" :key="player">
          {{ player }}<span v-if="index < players.length - 1">, </span>
        </span>
      </p>
    </div>

    <button @click="leaveRoom">Leave Room</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { io } from 'socket.io-client'

const route = useRoute()
const router = useRouter()
const socket = io('http://localhost:3001')

const roomId = ref(route.params.id as string)
const playerName = ref(route.query.name as string)
const connected = ref(false)
const players = ref<string[]>([])

onMounted(() => {
  socket.on('connect', () => {
    connected.value = true
    // Join room when connected
    socket.emit('join-room', {
      roomId: roomId.value,
      playerName: playerName.value,
    })
  })

  socket.on('room-updated', (room) => {
    players.value = room.players.filter((p: any) => p && p.name).map((p: any) => p.name)
  })
})

const leaveRoom = () => {
  socket.emit('leave-room', { roomId: roomId.value })
  router.push('/')
}

onUnmounted(() => {
  socket.disconnect()
})
</script>
