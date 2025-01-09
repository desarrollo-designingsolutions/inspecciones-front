<script setup lang="ts">
import { router } from '@/plugins/1.router';
import { useAuthenticationStore } from "@/stores/useAuthenticationStore";

definePage({
  name: "Vehicle-List",
  meta: {
    redirectIfLoggedIn: true,
    requiresAuth: true,
    requiredPermission: "menu.brand.vehicle",
  },
});

const loading = reactive({ excel: false })

const authenticationStore = useAuthenticationStore();

const goView = (data: { action: string, id: number | null } = { action: "create", id: null }) => {
  router.push({ name: "Vehicle-Form", params: { action: data.action, id: data.id } })
}

//TABLE
const tableFull = ref()

const optionsTable = {
  url: "/vehicle/list",
  params: {
    company_id: authenticationStore.company.id,
  },
  headers: [
    { key: 'license_plate', title: 'Placa' },
    { key: "type_vehicle_name", title: 'Clase de vehículo' },
    { key: "date_registration", title: 'Fecha de matrícula' },
    { key: "operator", title: 'Operador ??????' },
    { key: "model", title: 'Modelo' },
    { key: "city_name", title: 'Ciudad de operación' },
    { key: 'actions', title: 'Acciones' },
  ],
  actions: {
    changeStatus: {
      url: "/vehicle/changeStatus"
    },
    delete: {
      url: "/vehicle/delete"
    },
  }
}


//FILTER
const filterTable = ref()
const optionsFilter = ref({
  inputGeneral: {
    relationsGeneral: {
      all: ["license_plate", "model"],
      type_vehicle: ["name"],
      city: ["name"],
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

  const { data, response } = await useApi("/vehicle/excelExport").post({
    searchQueryArray: filterTable.value.arrayFilter,
    searchQueryGeneral: filterTable.value.generalSearch,
    company_id: authenticationStore.company.id,
  })
  loading.excel = false;

  if (response.value?.ok && data.value) {
    downloadExcelBase64(data.value.excel, "Lista vehículos")
  }
}

</script>

<template>
  <div>

    <VCard>
      <VCardTitle class="d-flex justify-space-between">
        <span>
          Vehículos
        </span>

        <div class="d-flex justify-end gap-3 flex-wrap ">
          <VBtn :loading="loading.excel" :disabled="loading.excel" size="38" color="primary" icon
            @click="downloadExcel()">
            <VIcon icon="tabler-file-spreadsheet"></VIcon>
            <VTooltip location="top" transition="scale-transition" activator="parent" text="Descargar Excel">
            </VTooltip>
          </VBtn>

          <VBtn @click="goView()">
            Agregar vehículo
          </VBtn>
        </div>
      </VCardTitle>

      <VCardText class=" mt-2">
        <TableFull ref="tableFull" :optionsTable="optionsTable" :optionsFilter="optionsFilter" @goView="goView">


        </TableFull>
      </VCardText>
    </VCard>
  </div>
</template>
