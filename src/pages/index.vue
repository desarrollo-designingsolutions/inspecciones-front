<script setup lang="ts">
definePage({
  path: "/home",
  name: "Home",
  meta: {
    redirectIfLoggedIn: true,
    requiresAuth: true,
    requiredPermission: "menu.home",
  },
})

import { useAuthenticationStore } from '@/stores/useAuthenticationStore';

const { company, user } = storeToRefs(useAuthenticationStore())

</script>

<template>
  <div>
    <CountAllData v-if="hasPermission('dashboard.countAllData')" />
  </div>
</template>
