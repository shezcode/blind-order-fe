import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/create',
    name: 'CreateRoom',
    component: CreateRoomView,
  },
  {
    path: '/room/:id',
    name: 'Room',
    component: RoomView,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
