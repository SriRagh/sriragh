import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/LoginView.vue')
    },

    // dashboard
    {
      path: "/account-owner/dashboard",
      component: () => import("@/views/MainLayoutView/MainLayoutView.vue"),
      meta: {
        name: "account-owner",
        url: "/account-owner/dashboard",
      },
      children: [
        {
          path: "/account-owner/dashboard",
          name: "",
          component: () =>
            import("@/components/AccountOwner/AccountOwnerDashboard.vue"),
        },
        {
          path: "/account-owner/cases",
          name: "",
          component: () =>
            import("@/components/AccountOwner/AccountOwnerCases.vue"),
        },
        {
          path: "/account-owner/clients",
          name: "",
          component: () =>
            import("@/components/AccountOwner/AccountOwnerClients.vue"),
        },
      ]
    }
    
  ]
})

export default router
