<script setup lang="ts">
import { router } from "@/plugins/1.router";
import { useAuthenticationStore } from "@/stores/useAuthenticationStore";

definePage({
  name: "Maintenance-List",
  meta: {
    redirectIfLoggedIn: true,
    requiresAuth: true,
    requiredPermission: "maintenance.list",
  },
});


const loading = reactive({
  excel: false,
  btnCreate: false,

})

const authenticationStore = useAuthenticationStore();

const goView = (data: { action: string, id: string | null, maintenance_type_id: string | null } = { action: "create", id: null, maintenance_type_id: null }) => {

  if (isNullOrUndefined(data.maintenance_type_id)) {
    const tableData = tableFull.value.optionsTable.tableData;
    const search = tableData.find((item: any) => item.id == data.id)
    data.maintenance_type_id = search.maintenance_type_id;
  }

  router.push({ name: "Maintenance-Form", params: { action: data.action, id: data.id, maintenance_type_id: data.maintenance_type_id } })
}

//TABLE
const tableFull = ref()

const optionsTable = {
  url: "/inspection/list",
  params: {
    company_id: authenticationStore.company.id,
  },
  headers: [
    { key: 'maintenance_date', title: 'Fecha de inspección' },
    { key: 'vehicle_license_plate', title: 'Placa' },
    { key: 'vehicle_brand_name', title: 'Marca' },
    { key: "vehicle_model", title: 'Modelo' },
    { key: "maintenance_type_name", title: 'Tipo de inspección' },
    { key: "user_full_name", title: 'Inspector' },
    { key: 'actions', title: 'Acciones' },
  ],
  actions: {
    changeStatus: {
      url: "/maintenance/changeStatus"
    },
    delete: {
      url: "/maintenance/delete"
    },
  }
}

const maintenanceTypeBtn = ref([]);

const fetchDataBtn = async () => {
  loading.btnCreate = true
  const url = "/maintenance/loadBtnCreate";

  const { data, response } = await useApi<any>(
    createUrl(url)
  );
  if (response.value?.ok && data.value) {
    maintenanceTypeBtn.value = data.value.maintenance_type;
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
    searchQuery: filterTable.value,
    company_id: authenticationStore.company.id,
  })
  loading.excel = false;

  if (response.value?.ok && data.value) {
    downloadExcelBase64(data.value.excel, "Lista vehículos")
  }
}

onMounted(() => {
  fetchDataBtn();
})

</script>

<template>
  <div>

    <VCard>
      <VCardTitle class="d-flex justify-space-between">
        <span>
          Mantenimiento
        </span>

        <div class="d-flex justify-end gap-3 flex-wrap ">
          <!-- <VBtn :loading="loading.excel" :disabled="loading.excel" size="38" color="primary" icon
            @click="downloadExcel()">
            <VIcon icon="tabler-file-spreadsheet"></VIcon>
            <VTooltip location="top" transition="scale-transition" activator="parent" text="Descargar Excel">
            </VTooltip>
          </VBtn> -->

          <VMenu location="bottom">
            <template #activator="{ props }">
              <VBtn v-bind="props" :loading="loading.btnCreate" :disabled="loading.btnCreate">
                Agregar Mantenimiento
                <VIcon icon="tabler-circle-chevrons-down"></VIcon>
              </VBtn>
            </template>

            <VList>
              <VListItem v-for="(item, index) in maintenanceTypeBtn" :key="index"
                @click="goView({ action: 'create', id: null, maintenance_type_id: item.id })">
                {{ item.name }}
              </VListItem>
            </VList>
          </VMenu>




        </div>
      </VCardTitle>

      <VCardText class=" mt-2">
        <TableFull ref="tableFull" :optionsTable="optionsTable" :optionsFilter="optionsFilter" @goView="goView">


        </TableFull>
      </VCardText>
    </VCard>
  </div>
</template>
