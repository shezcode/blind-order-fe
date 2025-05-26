<template>
  <div class="create-room">
    <h1>Create New Room</h1>

    <form @submit.prevent="createRoom">
      <div>
        <label>Your Name:</label>
        <input v-model="hostName" placeholder="Enter your name" required />
      </div>

      <div>
        <label>Number of Lives:</label>
        <input v-model.number="maxLives" type="number" min="1" max="5" required />
      </div>

      <div>
        <label>Numbers per Player:</label>
        <input v-model.number="numbersPerPlayer" type="number" min="4" max="8" required />
      </div>

      <button type="submit">Create Room</button>
      <router-link to="/">
        <button type="button">Back</button>
      </router-link>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const hostName = ref('')
const maxLives = ref(3)
const numbersPerPlayer = ref(6)

const createRoom = async () => {
  if (!hostName.value) return

  const response = await fetch('http://localhost:3001/room', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      maxLives: maxLives.value,
      numbersPerPlayer: numbersPerPlayer.value,
    }),
  })

  const data = await response.json()

  // Navigate to the room with host name
  router.push(`/room/${data.roomId}?name=${hostName.value}&host=true`)
}
</script>
