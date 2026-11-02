import { createRouter, createWebHistory } from 'vue-router'
import { useSessionStore } from '../stores/session'
import LoginView from '../views/LoginView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import HomeView from '../views/HomeView.vue'
import ProfileView from '../views/ProfileView.vue'
import NotFoundView from '../views/NotFoundView.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { auth: true } },
    { path: '/profile', name: 'profile', component: ProfileView, meta: { auth: true } },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/forgot-password', name: 'forgot', component: ForgotPasswordView },
    { path: '/reset-password', name: 'reset', component: ResetPasswordView },
    { path: '/:pathMatch(.*)*', name: '404', component: NotFoundView }
  ]
})

router.beforeEach(async (to) => {
  if (!to.meta.auth) return true
  const store = useSessionStore()
  if (!store.checked) await store.refresh()
  if (store.session) return true
  return { name: 'login', query: { redirect: to.fullPath } }
})
