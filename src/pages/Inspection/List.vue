<script setup lang="ts">
import ModalShowReportInfo from "@/pages/Inspection/components/ModalShowReportInfo.vue";
import { router } from "@/plugins/1.router";
import ModalForm from '@/pages/Inspection/Components/ModalForm.vue';
import { useAuthenticationStore } from "@/stores/useAuthenticationStore";

definePage({
  name: "Inspection-List",
  meta: {
    redirectIfLoggedIn: true,
    requiresAuth: true,
    requiredPermission: "inspection.list",
  },
});


const loading = reactive({
  excel: false,
  btnCreate: false,

})

const authenticationStore = useAuthenticationStore();

//TABLE
const refTableFull = ref()
const optionsTable = {
  url: "/inspection/paginate",
  paramsGlobal: {
    company_id: authenticationStore.company.id,
  },
  headers: [
    { key: 'inspection_date', title: 'Fecha de inspección' },
    { key: 'vehicle_license_plate', title: 'Placa' },
    { key: 'vehicle_brand_name', title: 'Marca' },
    { key: "vehicle_model", title: 'Modelo' },
    { key: "inspection_type_name", title: 'Tipo de inspección' },
    { key: "user_inspector_full_name", title: 'Inspector' },
    { key: "is_active", title: 'Estado' },
    { key: 'actions', title: 'Acciones', sortable: false },
  ],
  actions: {
    changeStatus: {
      url: "/inspection/changeStatus"
    },
    delete: {
      url: "/inspection/delete"
    },
  },
}

const inspectionTypeBtn = ref([]);

const fetchDataBtn = async () => {
  loading.btnCreate = true
  const url = "/inspection/loadBtnCreate";

  const { data, response } = await useApi<any>(
    createUrl(url)
  );
  if (response.value?.ok && data.value) {
    inspectionTypeBtn.value = data.value.inspection_type;
  }
  loading.btnCreate = false
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

const inspectionTypes = ref([
  {
    value: 'Pre-Operacional',
    title: 'Pre-Operacional',
  },
  {
    value: 'HSEQ',
    title: 'HSEQ',
  },
])

const company = {
  company_id: authenticationStore.company.id,
}

//FILTER
const filterTable = ref()
const optionsFilterNew = ref({
  dialog: {
    width: 800,
    cols: 6,
    inputs: [
      {
        type: "dateRange",
        label: "Fecha de inspección",
        name: "inspection_date",
      },
      {
        type: "selectApi",
        label: "Placa del vehículo",
        arrayInfo: "plateVehicle",
        name: "vehicle_id",
        url: "selectInfinitePlateVehicle",
        param: company,
      },
      {
        type: "selectApi",
        label: "Marca de vehículo",
        arrayInfo: "brandVehicle",
        name: "vehicle.brand_vehicle",
        url: "selectInfiniteBrandVehicle",
        param: company,
      },
      {
        type: "select",
        label: "Modelo",
        name: 'vehicle.model',
        options: models,
      },
      {
        type: "select",
        label: "Tipo de inspección",
        name: 'inspectionType.name',
        options: inspectionTypes.value,
      },
      {
        type: "selectApi",
        label: "Inspector",
        arrayInfo: "userInspector",
        name: "user_inspector_id",
        url: "selectInfiniteUserInspector",
        param: company,
      },
      {
        type: "booleanActive",
        label: "Estado",
        name: 'is_active',
      },
    ],
  },
  filterLabels: { inputGeneral: 'Buscar en todo' }
})

const setFilterTable = async (data: any) => {
  filterTable.value = data;
}

const route = useRoute()
const downloadExcel = async () => {
  loading.excel = true;

  const { data, response } = await useAxios("/inspection/excelExport").get({
    params: {
      ...route.query,
      company_id: authenticationStore.company.id
    }
  })

  loading.excel = false;

  if (response.status == 200 && data) {
    downloadExcelBase64(data.excel, "Lista inspecciones")
  }
}

onMounted(() => {
  fetchDataBtn();
})

const pdfExport = async (item: any) => {

  const { data, response } = await useAxios("/inspection/pdfExport").post({
    id: item.id,
    company_id: authenticationStore.company.id,
    pdf_name: "Lista inspecciones",
  })

  if (response.status == 200 && data) {
    openPdfBase64(data.pdf)
  }
}

const goViewView = async (data: any) => {
  if (isNullOrUndefined(data.inspection_type_id)) {
    const tableData = refTableFull.value.optionsTable.tableData;
    const search = tableData.find((item: any) => item.id == data.id)
    data.inspection_type_id = search.inspection_type_id;
  }
  router.push({ name: "Inspection-Form", params: { action: 'view', id: data.id, inspection_type_id: data.inspection_type_id } })
}

const goViewEdit = async (data: any) => {
  if (isNullOrUndefined(data.inspection_type_id)) {
    const tableData = refTableFull.value.optionsTable.tableData;
    const search = tableData.find((item: any) => item.id == data.id)
    data.inspection_type_id = search.inspection_type_id;
  }
  router.push({ name: "Inspection-Form", params: { action: 'edit', id: data.id, inspection_type_id: data.inspection_type_id } })
}

const goViewCreate = async (data: any) => {
  router.push({ name: "Inspection-Form", params: { action: 'create', inspection_type_id: data.inspection_type_id } })
}

const tableLoading = ref(false);

// Método para refrescar los datos
const refreshTable = () => {
  if (refTableFull.value) {
    refTableFull.value.fetchTableData(null, false, true); // Forzamos la búsqueda
  }
};

//ModalShowReportInfo
const refModalShowReportInfo = ref()

const openModalShowReportInfo = (inspection: object) => {
  refModalShowReportInfo.value.openModal(inspection)
}


</script>

<template>
  <div>

    <VCard>
      <VCardTitle class="d-flex justify-space-between">
        <span>
          Inspecciones
        </span>

        <div class="d-flex justify-end gap-3 flex-wrap ">
          <VBtn :loading="loading.excel" :disabled="loading.excel" size="38" color="primary" icon
            @click="downloadExcel()">
            <VIcon icon="tabler-file-spreadsheet"></VIcon>
            <VTooltip location="top" transition="scale-transition" activator="parent" text="Descargar Excel">
            </VTooltip>
          </VBtn>

          <VBtn :loading="loading.report" :disabled="loading.report" color="primary" @click="refModalForm.openModal()">
            Generar reporte
          </VBtn>

          <VMenu location="bottom"
            v-if="hasPermission('inspection.type1.form') && hasPermission('inspection.type2.form')">
            <template #activator="{ props }">
              <VBtn v-bind="props" :loading="loading.btnCreate" :disabled="loading.btnCreate">
                Agregar Inspeccion
                <VIcon icon="tabler-circle-chevrons-down"></VIcon>
              </VBtn>
            </template>

            <VList>
              <VListItem v-for="(item, index) in inspectionTypeBtn" :key="index"
                @click="goViewCreate({ inspection_type_id: item.id })">
                {{ item.name }}
              </VListItem>
            </VList>
          </VMenu>
        </div>
      </VCardTitle>

      <VCardText>
        <FilterDialogNew :options-filter="optionsFilterNew" @force-search="refreshTable" :table-loading="tableLoading">
        </FilterDialogNew>
      </VCardText>

      <VCardText class="mt-2">
        <TableFullNew ref="refTableFull" :options="optionsTable" @edit="goViewEdit" @view="goViewView"
          @update:loading="tableLoading = $event" @searchParams="setFilterTable">
          <template #item.actions2="{ item }">
            <VListItem @click="pdfExport(item)">
              <template #prepend>
                <VIcon size="22" icon="tabler-file-type-pdf" />
              </template>
              <span>Reporte</span>
            </VListItem>

            <VListItem @click="openModalShowReportInfo(item)">
              <template #prepend>
                <VIcon size="22" icon="tabler-file-report" />
              </template>
              <span>Informe</span>
            </VListItem>
          </template>
        </TableFullNew>
      </VCardText>
    </VCard>

    <ModalShowReportInfo ref="refModalShowReportInfo" />
  </div>
</template>
