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

const route = useRoute()

const loading = reactive({
  excel: false,
  report: false
})

const authenticationStore = useAuthenticationStore();


//TABLE
const refTableFull = ref()
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

  const { data, response } = await useAxios("/vehicle/excelExport").get({
    params: {
      ...route.query,
      company_id: authenticationStore.company.id
    }
  })

  loading.excel = false;

  if (response.status == 200 && data) {
    downloadExcelBase64(data.excel, "Lista vehículos")
  }
}

const loadingItems = reactive({});

const pdfExport = async (item: any) => {

  loadingItems[item.id] = true;

  const { data, response } = await useAxios("/vehicle/pdfExport").post({
    id: item.id,
    company_id: authenticationStore.company.id,
    pdf_name: "hoja_de_vida_" + item.license_plate,
  })

  if (response.status == 200 && data) {
    descargarArchivo(data.path, 'pdf.pdf')
  }

  loadingItems[item.id] = false;
}

const goViewView = async (data: any) => {
  router.push({ name: "Vehicle-Form", params: { action: 'view', id: data.id } })
}

const goViewEdit = async (data: any) => {
  router.push({ name: "Vehicle-Form", params: { action: 'edit', id: data.id } })
}

const goViewCreate = async () => {
  router.push({ name: "Vehicle-Form", params: { action: 'create' } })
}

const tableLoading = ref(false);

// Método para refrescar los datos
const refreshTable = () => {
  if (refTableFull.value) {
    refTableFull.value.fetchTableData(null, false, true); // Forzamos la búsqueda
  }
};
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

          <VBtn @click="goViewCreate()">
            Agregar vehículo
          </VBtn>
        </div>
      </VCardTitle>

      <VCardText>
        <FilterDialogNew :options-filter="optionsFilterNew" @force-search="refreshTable" :table-loading="tableLoading">
        </FilterDialogNew>
      </VCardText>

      <VCardText class="mt-2">
        <TableFullNew ref="refTableFull" :options="optionsTable" @edit="goViewEdit" @view="goViewView"
          @update:loading="tableLoading = $event">

          <template #item.actions="{ item }">
            <VMenu>
              <template #activator="{ props }">
                <VBtn color="primary" v-bind="props" :loading="loadingItems[item.id]" append-icon="tabler-chevron-down">
                  Acciones
                </VBtn>
              </template>
              <VList>
                <VListItem @click="goViewView(item)">
                  <template #prepend>
                    <VIcon icon="tabler-eye" />
                  </template>
                  <span>Ver</span>
                </VListItem>
                <VListItem @click="goViewEdit(item)">
                  <template #prepend>
                    <VIcon icon="tabler-pencil" />
                  </template>
                  <span>Editar</span>
                </VListItem>
                <VListItem @click="refTableFull.openDeleteModal(item.id)">
                  <template #prepend>
                    <VIcon icon="tabler-trash" />
                  </template>
                  <span>Eliminar</span>
                </VListItem>
                <VListItem @click="pdfExport(item)">
                  <template #prepend>
                    <VIcon size="22" icon="tabler-file-type-pdf" />
                  </template>
                  <span>CV vehículo</span>
                </VListItem>
              </VList>
            </VMenu>
          </template>

        </TableFullNew>
      </VCardText>
    </VCard>

  </div>
</template>
