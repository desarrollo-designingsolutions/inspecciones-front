<script setup lang="ts">
import { router } from '@/plugins/1.router';
import { useAuthenticationStore } from "@/stores/useAuthenticationStore";

definePage({
  name: "Emergency-Element-List",
  meta: {
    redirectIfLoggedIn: true,
    requiresAuth: true,
    requiredPermission: "menu.emergency.element",
  },
});

const authenticationStore = useAuthenticationStore();

const route = useRoute()

const loading = reactive({ excel: false })

//TABLE
const refTableFull = ref()
const optionsTable = {
  url: "/emergency-element/paginate",
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
      url: "/emergency-element/changeStatus"
    },
    delete: {
      url: "/emergency-element/delete"
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
  router.push({ name: "Emergency-Element-Form", params: { action: 'view', id: data.id } })
}

const goViewEdit = async (data: any) => {
  router.push({ name: "Emergency-Element-Form", params: { action: 'edit', id: data.id } })
}

const goViewCreate = async () => {
  router.push({ name: "Emergency-Element-Form", params: { action: 'create' } })
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

  const { data, response } = await useAxios("/emergency-element/excelExport").get({
    params: {
      ...route.query,
      company_id: authenticationStore.company.id
    }
  })

  loading.excel = false;

  if (response.status == 200 && data) {
    downloadExcelBase64(data.excel, "Lista Elementos de emergencia")
  }
}

</script>

<template>
  <div>

    <VCard>
      <VCardTitle class="d-flex justify-space-between">
        <span>
          Elementos de emergencia
        </span>

        <div class="d-flex justify-end gap-3 flex-wrap ">
          <VBtn :loading="loading.excel" :disabled="loading.excel" size="38" color="primary" icon
            @click="downloadExcel()">
            <VIcon icon="tabler-file-spreadsheet"></VIcon>
            <VTooltip location="top" transition="scale-transition" activator="parent" text="Descargar Excel">
            </VTooltip>
          </VBtn>

          <VBtn @click="goViewCreate()">
            Agregar elemento de emergencia
          </VBtn>
        </div>
      </VCardTitle>

      <VCardText>
        <FilterDialogNew :options-filter="optionsFilterNew" @force-search="refreshTable" :table-loading="tableLoading">
        </FilterDialogNew>
      </VCardText>

      <VCardText class=" mt-2">
        <TableFullNew ref="refTableFull" :options="optionsTable" @edit="goViewEdit" @view="goViewView"
          @update:loading="tableLoading = $event">
        </TableFullNew>
      </VCardText>
    </VCard>
  </div>
</template>
