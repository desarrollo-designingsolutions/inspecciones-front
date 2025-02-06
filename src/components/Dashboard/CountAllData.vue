<script setup lang="ts">
import { useAuthenticationStore } from "@/stores/useAuthenticationStore";
const authenticationStore = useAuthenticationStore();

interface CountData {
    icon: string;
    color: string;
    title: string;
    value: string | number;
    isHover: boolean;
    to: any;
}

const countData = ref<CountData[]>([
    {
        "icon": 'tabler-user-shield',
        "color": 'success',
        "title": 'Vehículos activos',
        "value": 0,
        "isHover": false,
        "to": { name: "Vehicle-List" },
    },
    {
        "icon": 'tabler-password-user',
        "color": 'warning',
        "title": 'Clientes activos',
        "value": 0,
        "isHover": false,
        "to": { name: "Project-List" },
    },
    {
        "icon": 'tabler-checklist',
        "color": 'error',
        "title": 'Inspecciones pre-operacionales activas',
        "value": 0,
        "isHover": false,
        "to": { name: "Task-List" },
    },
    {
        "icon": 'tabler-users',
        "color": 'info',
        "title": 'Inspecciones HSEQ activas',
        "value": 0,
        "isHover": false,
        "to": { name: "Client-List" },
    },
    {
        "icon": 'tabler-users',
        "color": 'info',
        "title": 'Mantenimientos completados',
        "value": 0,
        "isHover": false,
        "to": { name: "Client-List" },
    },
]);
const isLoading = ref<boolean>(true)

onMounted(async () => {
    isLoading.value = true;
    //   const { data, response } = await useApi<any>(
    //     createUrl(`/dashboard/countAllData`, {
    //       query: {
    //         company_id: authenticationStore.company.id,
    //         user_id: authenticationStore.user.role_id == ROLE_SUPERADMIN_UUID ? null : authenticationStore.user.id,
    //       },
    //     })
    //   );

    //   isLoading.value = false;

    //   if (response.value?.ok && data.value) {
    //     countData.value[0].value = data.value.userCount
    //     countData.value[1].value = data.value.projectCount
    //     countData.value[2].value = data.value.taskCount
    //     countData.value[3].value = data.value.clientCount
    //   }
});

</script>

<template>
    <VRow>
        <VCol v-for="(data, index) in countData" :key="index" cols="12" md="3" sm="6">
            <div>
                <VCard :to="data.to"
                    :style="data.isHover ? `border-block-end-color: rgb(var(--v-theme-${data.color}))` : `border-block-end-color: rgba(var(--v-theme-${data.color}),0.38)`"
                    @mouseenter="data.isHover = true" @mouseleave="data.isHover = false">
                    <VSkeletonLoader :loading="isLoading" type="avatar,list-item, list-item">
                        <VCardText>
                            <div class="d-flex align-center gap-x-4 mb-1">
                                <VAvatar variant="tonal" :color="data.color" rounded>
                                    <VIcon :icon="data.icon" size="28" />
                                </VAvatar>
                                <h4 class="text-h4">
                                    {{ data.value }}
                                </h4>
                            </div>
                            <div class="text-body-1 mb-1">
                                {{ data.title }}
                            </div>
                        </VCardText>
                    </VSkeletonLoader>
                </VCard>
            </div>
        </VCol>
    </VRow>
</template>
