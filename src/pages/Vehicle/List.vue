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
    { key: "model", title: 'Modelo' },
    { key: "city_name", title: 'Ciudad de operación' },
    { key: "is_active", title: 'Estado' },
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
        input_type: "dateRange",
        title: "Fecha de matricula",
        key: "date_registration",
      },
    ],
  }
})

const downloadExcel = async () => {
  loading.excel = true;
  filterTable.value = tableFull.value.optionsTable.searchQuery;

  const { data, response } = await useApi("/vehicle/excelExport").post({
    searchQuery: filterTable.value,
    company_id: authenticationStore.company.id,
  })
  loading.excel = false;

  if (response.value?.ok && data.value) {
    downloadExcelBase64(data.value.excel, "Lista vehículos")
  }
}

const pdfExport = async (item: any) => {

  const { data, response } = await useApi("/vehicle/pdfExport").post({
    id: item.id,
    company_id: authenticationStore.company.id,
    pdf_name: "hoja_de_vida_" + item.license_plate,
  })

  if (response.value?.ok && data.value) {
    openPdfBase64(data.value.pdf)
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

          <template #item.actions2="{ item }">

            <VListItem @click="pdfExport(item)">
              <template #prepend>
                <VIcon size="22" icon="tabler-file-type-pdf" />
              </template>
              <span>CV vehículo</span>
            </VListItem>


          </template>


        </TableFull>
      </VCardText>
    </VCard>
  </div>
</template>
