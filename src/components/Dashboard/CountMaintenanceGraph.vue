<script setup lang="ts">
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip
} from 'chart.js';
import chartjsPluginDatalabels from 'chartjs-plugin-datalabels'; // Importar el plugin
import { Bar } from 'vue-chartjs';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, chartjsPluginDatalabels);

import { useAuthenticationStore } from "@/stores/useAuthenticationStore";
const authenticationStore = useAuthenticationStore();

const labels = ref<Array<string>>([]);
const datasets = ref<Array<object>>([]);
const formSearch = ref({
  year: null as null | string | number,
  vehicle_id: null as null | string,
});

const loading = reactive({
  vehicleMaintenanceComparison: false,
  excel: false,
})

formSearch.value.year = new Date().getFullYear()

const years = ref([])

const fetchData = async () => {

  loading.vehicleMaintenanceComparison = true;

  const { data, response } = await useApi<any>(
    createUrl(`/dashboard/vehicleMaintenanceComparison`, {
      query: {
        company_id: authenticationStore.company.id,
        year: formSearch.value.year,
        vehicle_id: formSearch.value.vehicle_id?.value,
      },
    })
  );


  if (response.value?.ok && data.value) {
    datasets.value = data.value.datasets;
    labels.value = data.value.labels;
    years.value = data.value.years;
  }
  loading.vehicleMaintenanceComparison = false;
};

fetchData();

const chartData = computed(() => {
  return {
    labels: labels.value,
    datasets: datasets.value,
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      top: 30,    // Ajusta el margen superior
      bottom: 10, // Ajusta el margen inferior
      left: 10,   // Ajusta el margen izquierdo (si es necesario)
      right: 10,  // Ajusta el margen derecho (si es necesario)
    },
  },
  plugins: {
    legend: {
      position: 'bottom',
    },
    tooltip: {
      callbacks: {
        label: function (tooltipItem) {
          const value = tooltipItem.raw;  // Este es el valor de la barra
          const dataset = tooltipItem.dataset;  // El dataset de la barra
          const labelDataset = tooltipItem.dataset.label;  // El label de la barra
          // Retornar tanto el porcentaje como la cantidad de tareas
          return `Número de mantenimientos: ${value}`;
        },
      },
    },
    // Configurar el plugin de datalabels
    datalabels: {
      color: 'white',  // Color del texto
      anchor: 'end',  // Posición del texto en el extremo de la barra
      align: 'end', // Alineación del texto (encima de la barra)
      offset: 5,  // Espaciado de la etiqueta respecto a la barra
      backgroundColor: (context) => {
        // Obtener el color del dataset desde el contexto
        const datasetIndex = context.datasetIndex;
        const dataset = context.chart.data.datasets[datasetIndex];
        return dataset.backgroundColor || '#000';  // Devuelve el color de fondo del dataset
      },
      borderColor: (context) => {
        // Obtener el color del borde desde el contexto
        const datasetIndex = context.datasetIndex;
        const dataset = context.chart.data.datasets[datasetIndex];
        return dataset.borderColor || '#000';  // Devuelve el color de borde del dataset
      },
      borderWidth: 1,
      borderRadius: 5,
      font: {
        size: 12, // Tamaño de la fuente
        weight: 'bold', // Peso de la fuente
      },
      // Formatear el valor para que solo se muestre si es diferente de cero
      formatter: (value, tooltipItem) => {
        // Solo mostrar la etiqueta si el valor es diferente de cero
        return value !== 0 ? `Total: ${value}` : null;
      },
    },
  },
  scales: {
    x: {
      stacked: true, // Cambiar a true si quieres barras apiladas
      barPercentage: 0.8,
      categoryPercentage: 0.5,
    },
    y: {
      ticks: {
        stepSize: 1,
        callback: function (value) {
          return value;
        },
      },
    },
  },
  elements: {
    bar: {
      borderWidth: 2,
      borderColor: '#000',
      borderRadius: 8,
    },
  },
};


//EXCEL 
const downloadExcel = async () => {
  loading.excel = true;
  const { data, response } = await useApi("/task/excelExport").post({
    company_id: authenticationStore.company.id,
    ...formSearch.value,
  })

  loading.excel = false;

  if (response.value?.ok && data.value) {
    downloadExcelBase64(data.value.excel, "Lista de tareas por usuario")
  }
}
</script>

<template>
  <!-- 👉 Topic You are Interested in -->
  <AppCardActions title="Resumen de mantenimientos por mes" actionRefresh @refresh="fetchData"
    v-model:loading="loading.vehicleMaintenanceComparison">

    <VCardText v-if="!loading.vehicleMaintenanceComparison">
      <VRow>
        <VCol cols="12" md="4">
          <AppSelect label="Año" v-model="formSearch.year" :items="years" />
        </VCol>
        <VCol cols="12" md="4">
          <SelectPlateVehicleForm clearable label="Placa del vehículo" v-model="formSearch.vehicle_id" />
        </VCol>
        <VCol cols="12" md="1" class="mt-7">
          <VBtn icon size="30" @click="fetchData()">
            <VIcon icon="tabler-search"></VIcon>
          </VBtn>
          <!-- <VBtn class="ml-2" :loading="loading.excel" :disabled="loading.excel" icon size="30" @click="downloadExcel()">
            <VIcon icon="tabler-file-spreadsheet"></VIcon>
            <VTooltip location="top" transition="scale-transition" activator="parent" text="Descargar Excel">
            </VTooltip>
          </VBtn> -->
        </VCol>
      </VRow>
    </VCardText>

    <VCardText>
      <div class="chart-container">
        <Bar ref="chartInstance" :data="chartData" :options="chartOptions" />
      </div>
    </VCardText>
  </AppCardActions>
</template>

<style lang="scss">
.chart-container {
  height: 20rem;
  width: 100%;
  /* Asegúrate de que el contenedor tome todo el espacio disponible */
}
</style>
