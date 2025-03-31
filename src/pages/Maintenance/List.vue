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


const authenticationStore = useAuthenticationStore();

const route = useRoute()

const loading = reactive({
  excel: false,
  btnCreate: false,
})


//TABLE
const refTableFull = ref()
const optionsTable = {
  url: "/maintenance/paginate",
  paramsGlobal: {
    company_id: authenticationStore.company.id,
    ...((hasPermission('maintenance.make.form') && !hasPermission('maintenance.create.form')) && { user_mechanic_id: authenticationStore.user.id }),
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
const optionsFilterNew = ref({
  dialog: {
    width: 600,
    inputs: [
      {
        type: "dateRange",
        label: "Fecha de mantenimiento",
        name: "maintenance_date",
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
        name: "vehicle.brand_vehicle_id",
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
        type: "selectApi",
        label: "Inspector",
        arrayInfo: "userInspector",
        name: "user_inspector.id",
        url: "selectInfiniteUserInspector",
        param: company,
      },
      {
        type: "selectApi",
        label: "Mecánico",
        arrayInfo: "userMechanic",
        name: "user_mechanic.id",
        url: "selectInfiniteUserMechanic",
        param: company,
      },
      {
        type: "selectApi",
        label: "Estado",
        arrayInfo: "status",
        name: "status",
        url: "selectResponseStatus",
        param: company,
      },
    ],
  },
  filterLabels: { inputGeneral: 'Buscar en todo' }
})

const goViewView = async (data: any) => {
  if (isNullOrUndefined(data.maintenance_type_id)) {
    const tableData = refTableFull.value.optionsTable.tableData;
    const search = tableData.find((item: any) => item.id == data.id)
    data.maintenance_type_id = search.maintenance_type_id;
  }
  router.push({ name: "Maintenance-Form", params: { action: 'view', id: data.id } })
}

const goViewEdit = async (data: any) => {
  if (isNullOrUndefined(data.maintenance_type_id)) {
    const tableData = refTableFull.value.optionsTable.tableData;
    const search = tableData.find((item: any) => item.id == data.id)
    data.maintenance_type_id = search.maintenance_type_id;
  }
  router.push({ name: "Maintenance-Form", params: { action: 'edit', id: data.id } })
}

const goViewCreate = async (data: any) => {
  if (isNullOrUndefined(data.maintenance_type_id)) {
    const tableData = refTableFull.value.optionsTable.tableData;
    const search = tableData.find((item: any) => item.id == data.id)
    data.maintenance_type_id = search.maintenance_type_id;
  }
  router.push({ name: "Maintenance-Form", params: { action: 'create' } })
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

  const { data, response } = await useAxios("/maintenance/excelExport").get({
    params: {
      ...route.query,
      company_id: authenticationStore.company.id
    }
  })

  loading.excel = false;

  if (response.status == 200 && data) {
    downloadExcelBase64(data.excel, "Listado de mantenimientos")
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

          <VBtn v-if="hasPermission('maintenance.create.form')" :loading="loading.btnCreate"
            :disabled="loading.btnCreate" v-for="(item, index) in maintenanceTypeBtn" :key="index"
            @click="goViewCreate({ maintenance_type_id: item.id })">
            Agregar Mantenimiento
            <VIcon icon="tabler-plus"></VIcon>
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
