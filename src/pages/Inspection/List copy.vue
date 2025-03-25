<script setup lang="ts">
import { router } from "@/plugins/1.router";
import { useAuthenticationStore } from "@/stores/useAuthenticationStore";


const loading = reactive({
  excel: false,
  btnCreate: false,

})

const authenticationStore = useAuthenticationStore();

const goView = (data: { action: string, id: string | null, inspection_type_id: string | null } = { action: "create", id: null, inspection_type_id: null }) => {

  if (isNullOrUndefined(data.inspection_type_id)) {
    const tableData = tableFull.value.optionsTable.tableData;
    const search = tableData.find((item: any) => item.id == data.id)
    data.inspection_type_id = search.inspection_type_id;
  }

  router.push({ name: "Inspection-Form", params: { action: data.action, id: data.id, inspection_type_id: data.inspection_type_id } })
}

//TABLE
const tableFull = ref()

const optionsTable = {
  url: "/inspection/list",
  params: {
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
    { key: 'actions', title: 'Acciones' },
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
    years.push(year);
  }

  return years;
});

const company = {
  company_id: authenticationStore.company.id,
}

//FILTER
const filterTable = ref()
const optionsFilter = ref({
  inputGeneral: {
    relationsGeneral: {
      all: [],
      vehicle: ["license_plate", "model"],
      'vehicle.brand_vehicle': ["name"],
      inspectionType: ["name"],
      user: ["name", "surname"],
    },
  },
  dialog: {
    width: 500,
    inputs: [
      {
        input_type: "dateRange",
        title: "Fecha de inspección",
        key: "inspection_date",
      },
      {
        input_type: "selectInfinite",
        title: "Placa del vehículo",
        key: "plateVehicle",
        search_key: "license_plate",
        relation: 'vehicle',
        relation_key: 'license_plate',
        api: "selectInfinitePlateVehicle",
        paramsFilter: JSON.stringify(company),
      },
      {
        input_type: "selectInfinite",
        title: "Marca de vehículo",
        key: "brandVehicle",
        relation: 'vehicle',
        relation_key: 'brand_vehicle_id',
        api: "selectInfiniteBrandVehicle",
        paramsFilter: JSON.stringify(company),
      },
      {
        input_type: "select",
        title: "Modelo",
        key: 'model',
        relation: 'vehicle',
        relation_key: 'model',
        arrayList: models,
      },
      {
        input_type: "select",
        title: "Tipo de inspección",
        key: "inspectionType",
        relation: 'inspectionType',
        relation_key: 'name',
        arrayList: ['Pre-Operacional', 'HSEQ'],
      },
      {
        input_type: "selectInfinite",
        title: "Inspector",
        key: "userInspector",
        relation: 'user_inspector',
        relation_key: 'id',
        api: "selectInfiniteUserInspector",
        paramsFilter: JSON.stringify(company),
      },
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

  const { data, response } = await useApi("/inspection/excelExport").post({
    searchQuery: filterTable.value,
    company_id: authenticationStore.company.id,
  })
  loading.excel = false;

  if (response.value?.ok && data.value) {
    downloadExcelBase64(data.value.excel, "Lista inspecciones")
  }
}

onMounted(() => {
  fetchDataBtn();
})

const pdfExport = async (item: any) => {

  const { data, response } = await useApi("/inspection/pdfExport").post({
    id: item.id,
    company_id: authenticationStore.company.id,
    pdf_name: "Lista inspecciones",
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
          Inspecciones
        </span>

        <div class="d-flex justify-end gap-3 flex-wrap ">
          <VBtn :loading="loading.excel" :disabled="loading.excel" size="38" color="primary" icon
            @click="downloadExcel()">
            <VIcon icon="tabler-file-spreadsheet"></VIcon>
            <VTooltip location="top" transition="scale-transition" activator="parent" text="Descargar Excel">
            </VTooltip>
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
                @click="goView({ action: 'create', id: null, inspection_type_id: item.id })">

                {{ item.name }}
              </VListItem>
            </VList>
          </VMenu>


          <VBtn v-if="hasPermission('inspection.type1.form') && !hasPermission('inspection.type2.form')"
            :loading="loading.btnCreate" :disabled="loading.btnCreate"
            @click="goView({ action: 'create', id: null, inspection_type_id: '1' })">
            Agregar Inspeccion Pre-Operacional
            <VIcon icon="tabler-plus"></VIcon>
          </VBtn>

          <VBtn v-if="!hasPermission('inspection.type1.form') && hasPermission('inspection.type2.form')"
            :loading="loading.btnCreate" :disabled="loading.btnCreate"
            @click="goView({ action: 'create', id: null, inspection_type_id: '2' })">
            Agregar Inspeccion HSEQ
            <VIcon icon="tabler-plus"></VIcon>
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
              <span>Reporte</span>
            </VListItem>


          </template>

        </TableFull>
      </VCardText>
    </VCard>
  </div>
</template>
