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
  url: "/vehicle/paginate",
  paramsGlobal: {
    company_id: authenticationStore.company.id,
  },
  headers: [
    { key: 'license_plate', title: 'Placa' },
    { key: "type_vehicle_name", title: 'Clase de vehículo' },
    { key: "date_registration", title: 'Fecha de matrícula' },
    { key: "model", title: 'Modelo' },
    { key: "city_name", title: 'Ciudad de operación' },
    { key: "is_active", title: 'Estado' },
    { key: 'actions', title: 'Acciones', sortable: false },
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

const models = computed(() => {
  const startYear = 1950;
  const endYear = new Date().getFullYear() + 1; // Año actual + 1
  const years = [];

  for (let year = endYear; year >= startYear; year--) {
    years.push({
      value: year.toString(),
      title: year.toString(),
    });
  }

  return years;
});

const company = {
  company_id: authenticationStore.company.id,
}
//FILTER
const refFilterTable = ref()

//FILTER
const optionsFilterNew = ref({
  dialog: {
    width: 800,
    cols: 6,
    inputs: [
      {
        type: "selectApi",
        label: "Placa del vehículo",
        arrayInfo: "plateVehicle",
        name: "vehicles.id",
        url: "selectInfinitePlateVehicle",
        param: company,
      },
      {
        type: "selectApi",
        label: "Clase de vehículo",
        arrayInfo: "typeVehicle",
        name: 'type_vehicle_id',
        url: "selectInfiniteTypeVehicle",
        param: company,
      },
      {
        type: "dateRange",
        label: "Fecha de matrícula",
        name: "date_registration",
      },
      {
        type: "select",
        label: "Modelo",
        name: 'model',
        options: models,
      },
      {
        type: "booleanActive",
        label: "Estado",
        name: "is_active",
      },
    ],
  },
  filterLabels: { inputGeneral: 'Buscar en todo' }
})


const downloadExcel = async () => {
  loading.excel = true;
  refFilterTable.value = tableFull.value.optionsTable.searchQuery;

  const { data, response } = await useApi("/vehicle/excelExport").post({
    searchQuery: refFilterTable.value,
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
    descargarArchivo(data.value.path, 'pdf.pdf')
  }
}

const goViewEdit = async (data: any) => {
  refModalForm.value.openModal(data.id)
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

      <VCardText>
        <FilterDialogNew :options-filter="optionsFilterNew">
        </FilterDialogNew>
      </VCardText>

      <VCardText class=" mt-2">
        <TableFullNew ref="tableFull" :options="optionsTable" @edit="goViewEdit" @view="goViewEdit">
          <template #item.actions2="{ item }">
            <VListItem @click="pdfExport(item)">
              <template #prepend>
                <VIcon size="22" icon="tabler-file-type-pdf" />
              </template>
              <span>CV vehículo</span>
            </VListItem>
          </template>
        </TableFullNew>
      </VCardText>
    </VCard>
  </div>
</template>
