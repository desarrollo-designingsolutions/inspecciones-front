<script setup lang="ts">
import { router } from '@/plugins/1.router';
import { useAuthenticationStore } from "@/stores/useAuthenticationStore";

definePage({
  name: "Brand-Vehicle-List",
  meta: {
    redirectIfLoggedIn: true,
    requiresAuth: true,
    requiredPermission: "menu.brand.vehicle",
  },
});

const loading = reactive({ excel: false })

const authenticationStore = useAuthenticationStore();

const goView = (data: { action: string, id: number | null } = { action: "create", id: null }) => {
  router.push({ name: "Brand-Vehicle-Form", params: { action: data.action, id: data.id } })
}

//TABLE
const tableFull = ref()

const optionsTable = {
  url: "/brand-vehicle/list",
  params: {
    company_id: authenticationStore.company.id,
  },
  headers: [
    { key: 'name', title: 'Nombre' },
    { key: "is_active", title: 'Estado' },
    { key: 'actions', title: 'Acciones' },
  ],
  actions: {
    changeStatus: {
      url: "/brand-vehicle/changeStatus"
    },
    delete: {
      url: "/brand-vehicle/delete"
    },
  }
}


//FILTER
const filterTable = ref()
const optionsFilter = ref({
  inputGeneral: {
    relationsGeneral: {
      all: ["name"],
    },
  },
  dialog: {
    width: 500,
    inputs: [
      {
        input_type: "booleanActive",
        title: "Estado",
        key: "is_active",
      },
    ],
  }
})

const downloadExcel = async () => {
  loading.excel = true;
  filterTable.value = tableFull.value.optionsTable.searchQuery;

  const { data, response } = await useApi("/brand-vehicle/excelExport").post({
    searchQuery: filterTable.value,
    company_id: authenticationStore.company.id,
  })
  loading.excel = false;

  if (response.value?.ok && data.value) {
    downloadExcelBase64(data.value.excel, "Lista marcas de vehículos")
  }
}

</script>

<template>
  <div>

    <VCard>
      <VCardTitle class="d-flex justify-space-between">
        <span>
          Marcas de vehículos
        </span>

        <div class="d-flex justify-end gap-3 flex-wrap ">
          <VBtn :loading="loading.excel" :disabled="loading.excel" size="38" color="primary" icon
            @click="downloadExcel()">
            <VIcon icon="tabler-file-spreadsheet"></VIcon>
            <VTooltip location="top" transition="scale-transition" activator="parent" text="Descargar Excel">
            </VTooltip>
          </VBtn>

          <VBtn @click="goView()">
            Agregar marca de vehículo
          </VBtn>
        </div>
      </VCardTitle>

      <VCardText class=" mt-2">
        <TableFull ref="tableFull" :optionsTable="optionsTable" :optionsFilter="optionsFilter" @goView="goView">

          <template #item.logo="{ item }">
            <div class="my-2">
              <VAvatar v-if="item.logo" :size="38" class="me-3">
                <VImg :src="storageBack(item.logo)"></VImg>
              </VAvatar>
              <VAvatar v-else :size="38" class="me-3" color="primary" variant="tonal">
                {{ avatarText(item.name) }}
              </VAvatar>
            </div>
          </template>

        </TableFull>
      </VCardText>
    </VCard>
  </div>
</template>
