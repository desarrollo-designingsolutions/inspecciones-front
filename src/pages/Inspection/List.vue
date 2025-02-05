<script setup lang="ts">
import { router } from "@/plugins/1.router";
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

          <VMenu location="bottom">
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
