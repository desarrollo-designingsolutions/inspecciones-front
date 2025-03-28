<script setup lang="ts">
import { router } from '@/plugins/1.router';
import { useAuthenticationStore } from "@/stores/useAuthenticationStore";

definePage({
  name: "Type-Vehicle-List",
  meta: {
    redirectIfLoggedIn: true,
    requiresAuth: true,
    requiredPermission: "menu.type.vehicle",
  },
});

const route = useRoute()

const authenticationStore = useAuthenticationStore();

const loading = reactive({ excel: false })

//TABLE
const refTableFull = ref()
const optionsTable = {
  url: "/type-vehicle/paginate",
  paramsGlobal: {
    company_id: authenticationStore.company.id,
  },
  headers: [
    { key: 'name', title: 'Nombre' },
    { key: "is_active", title: 'Estado' },
    { key: 'actions', title: 'Acciones', sortable: false },
  ],
  actions: {
    changeStatus: {
      url: "/type-vehicle/changeStatus"
    },
    delete: {
      url: "/type-vehicle/delete"
    },
  }
}

//FILTER
const optionsFilterNew = ref({
  dialog: {
    width: 500,
    inputs: [
      {
        type: "booleanActive",
        label: "Estado",
        name: "is_active",
      },
    ],
  },
  filterLabels: { inputGeneral: 'Buscar en todo' }
})

const goViewView = async (data: any) => {
  router.push({ name: "Type-Vehicle-Form", params: { action: 'view', id: data.id } })
}

const goViewEdit = async (data: any) => {
  router.push({ name: "Type-Vehicle-Form", params: { action: 'edit', id: data.id } })
}

const goViewCreate = async () => {
  router.push({ name: "Type-Vehicle-Form", params: { action: 'create' } })
}

const tableLoading = ref(false);

// Método para refrescar los datos
const refreshTable = () => {
  if (refTableFull.value) {
    refTableFull.value.fetchTableData(null, false, true); // Forzamos la búsqueda
  }
};

const downloadExcel = async () => {
  loading.excel = true;

  const { data, response } = await useAxios("/type-vehicle/excelExport").get({
    params: {
      ...route.query,
      company_id: authenticationStore.company.id
    }
  })

  loading.excel = false;

  if (response.status == 200 && data) {
    downloadExcelBase64(data.excel, "Lista clase de vehículos")
  }
}

</script>

<template>
  <div>

    <VCard>
      <VCardTitle class="d-flex justify-space-between">
        <span>
          Clase de vehículos
        </span>

        <div class="d-flex justify-end gap-3 flex-wrap ">
          <VBtn :loading="loading.excel" :disabled="loading.excel" size="38" color="primary" icon
            @click="downloadExcel()">
            <VIcon icon="tabler-file-spreadsheet"></VIcon>
            <VTooltip location="top" transition="scale-transition" activator="parent" text="Descargar Excel">
            </VTooltip>
          </VBtn>

          <VBtn @click="goViewCreate()">
            Agregar clase de vehículo
          </VBtn>
        </div>
      </VCardTitle>

      <VCardText>
        <FilterDialogNew :options-filter="optionsFilterNew" @force-search="refreshTable" :table-loading="tableLoading">
        </FilterDialogNew>
      </VCardText>

      <VCardText class=" mt-2">
        <TableFullNew ref="refTableFull" :options="optionsTable" @edit="goViewEdit" @view="goViewView" @update:loading="tableLoading = $event">
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
        </TableFullNew>
      </VCardText>
    </VCard>
  </div>
</template>
