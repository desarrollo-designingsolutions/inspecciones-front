<script setup lang="ts">
import { useAuthenticationStore } from "@/stores/useAuthenticationStore";
const authenticationStore = useAuthenticationStore();

interface UserData {
  license_plate: string;
  inspection_count: string;
  maintenance_count: string;
  type_documents_count: string;
  emergency_elements_count: string;
}

const userData = ref<UserData[]>([]);

const formSearch = ref({
  start_date: null,
  end_date: null,
})

const loading = reactive({
  vehicleInfoForCompany: false,
  excel: false,
})

const fetchData = async () => {

  loading.vehicleInfoForCompany = true
  const { data, response } = await useApi<any>(
    createUrl(`/dashboard/vehicleInfoForCompany`, {
      query: {
        company_id: authenticationStore.company.id,
        start_date: formSearch.value.start_date,
        end_date: formSearch.value.end_date,
      },
    })
  );
  loading.vehicleInfoForCompany = false

  if (response.value?.ok && data.value) {
    userData.value = data.value.data;
  }
  console.log(userData.value)
}

fetchData()

const search = ref('')

// headers
const headers = [
  { title: 'Placa', key: 'license_plate' },
  { title: 'cantidad de inspecciones', key: 'inspection_count' },
  { title: 'cantidad de mantenimientos', key: 'maintenance_count' },
  { title: 'documentos vencidos', key: 'type_documents_count' },
  { title: 'elementos vencidos', key: 'emergency_elements_count' },
]

//EXCEL 
const downloadExcel = async () => {
  loading.excel = true;
  const { data, response } = await useApi<any>(
    createUrl(`/dashboard/vehicleInfoForCompanyExcelExport`, {
      query: {
        company_id: authenticationStore.company.id,
        user_name: search.value,
        start_date: formSearch.value.start_date,
        end_date: formSearch.value.end_date,
      },
    })
  );
  loading.excel = false;

  if (response.value?.ok && data.value) {
    downloadExcelBase64(data.value.excel, "Lista del resumen del tiempo de los usuarios")
  }
}
</script>

<template>
  <AppCardActions title="Resumen de datos de los vehículos" noActions v-model:loading="loading.vehicleInfoForCompany">
    <VCardText>
      <!-- <VRow>
        <VCol cols="12" md="4">
          <AppDateTimePicker clearable :requiredField="true" label="Fecha Inicio" v-model="formSearch.start_date"
            :config="{ dateFormat: 'Y-m-d' }" />
        </VCol>
        <VCol cols="12" md="4">
          <AppDateTimePicker clearable :requiredField="true" label="Fecha Fin" v-model="formSearch.end_date"
            :config="{ dateFormat: 'Y-m-d' }" />
        </VCol>
        <VCol cols="12" md="4">
          <VBtn class="mt-6" color="success" icon="tabler-search" @click="fetchData"></VBtn>
          <VBtn class="ml-2 mt-6" color="success" :loading="loading.excel" :disabled="loading.excel" icon
            @click="downloadExcel()">
            <VIcon icon="tabler-file-spreadsheet"></VIcon>
            <VTooltip location="top" transition="scale-transition" activator="parent" text="Descargar Excel">
            </VTooltip>
          </VBtn>
        </VCol>
      </VRow> -->
    </VCardText>

    <VCardText>
      <!-- 👉 Data Table  -->
      <VDataTable :headers="headers" :items="userData || []" :search="search" :items-per-page="5"
        items-per-page-text="Elementos por pagina">

        <template #top>
          <AppTextField v-model="search" clearable placeholder="Buscar ..." append-inner-icon="tabler-search"
            single-line hide-details dense outlined />
        </template>

      </VDataTable>
    </VCardText>
  </AppCardActions>
</template>
