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
  url: "/maintenance/list",
  params: {
    company_id: authenticationStore.company.id,
  },
  headers: [
    { key: 'maintenance_date', title: 'Fecha de Mantenimiento' },
    { key: 'vehicle_license_plate', title: 'Placa' },
    { key: 'vehicle_brand_name', title: 'Marca' },
    { key: "vehicle_model", title: 'Modelo' },
    { key: "user_inspector_full_name", title: 'Inspector' },
    { key: "user_mechanic_full_name", title: 'Asignado a' },
    { key: "status", title: 'Estado' },
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
      all: ['status|custom'],
      vehicle: ["license_plate", "model"],
      'vehicle.brand_vehicle': ["name"],
      user_inspector: ["name", "surname"],
      user_mechanic: ["name", "surname"],
    },
  },
  dialog: {
    width: 500,
    inputs: [
      {
        input_type: "dateRange",
        title: "Fecha de inspección",
        key: "maintenance_date",
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
        input_type: "selectInfinite",
        title: "Inspector",
        key: "userInspector",
        relation: 'user_inspector',
        relation_key: 'id',
        api: "selectInfiniteUserInspector",
        paramsFilter: JSON.stringify(company),
      },
      {
        input_type: "selectInfinite",
        title: "Mecanico",
        key: "userMechanic",
        relation: 'user_mechanic',
        relation_key: 'id',
        api: "selectInfiniteUserMechanic",
        paramsFilter: JSON.stringify(company),
      },
      {
        input_type: "selectInfinite",
        title: "Estado",
        key: "status",
        api: "selectResponseStatus",
      },
    ],
  }
})

const downloadExcel = async () => {
  loading.excel = true;
  filterTable.value = tableFull.value.optionsTable.searchQuery;

  const { data, response } = await useApi("/maintenance/excelExport").post({
    searchQuery: filterTable.value,
    company_id: authenticationStore.company.id,
  })
  loading.excel = false;

  if (response.value?.ok && data.value) {
    downloadExcelBase64(data.value.excel, "Listado de mantenimientos")
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
          <VBtn :loading="loading.excel" :disabled="loading.excel" size="38" color="primary" icon
            @click="downloadExcel()">
            <VIcon icon="tabler-file-spreadsheet"></VIcon>
            <VTooltip location="top" transition="scale-transition" activator="parent" text="Descargar Excel">
            </VTooltip>
          </VBtn>

          <!-- <VMenu location="bottom">
            <template #activator="{ props }">
              <VBtn v-bind="props" :loading="loading.btnCreate" :disabled="loading.btnCreate">
                Agregar Mantenimiento
                <VIcon icon="tabler-circle-chevrons-down"></VIcon>
              </VBtn>
            </template>

<VList>
  <VListItem>
    {{ item.name }}
  </VListItem>
</VList>
</VMenu> -->

          <VBtn :loading="loading.btnCreate" :disabled="loading.btnCreate" v-for="(item, index) in maintenanceTypeBtn"
            :key="index" @click="goView({ action: 'create', id: null, maintenance_type_id: item.id })">
            Agregar Mantenimiento
            <VIcon icon="tabler-plus"></VIcon>
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
