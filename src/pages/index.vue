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
    <VRow>
      <VCol cols="12">
        <CountAllData />
      </VCol>
      <VCol cols="12" md="12">
        <VehicleInfoForCompany />
      </VCol>
      <VCol cols="12" md="6">
        <CountInspectionsGraph />
      </VCol>
      <VCol cols="12" md="6">
        <CountMaintenanceGraph />
      </VCol>
    </VRow>
  </div>
</template>
