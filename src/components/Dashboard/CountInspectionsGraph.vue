<script setup lang="ts">
import { useAuthenticationStore } from "@/stores/useAuthenticationStore";
import { computed, reactive, ref } from 'vue';
const authenticationStore = useAuthenticationStore();

// Estado de carga
const loading = reactive({
    vehicleInspectionsComparison: false,
});

// Aquí se almacenará el arreglo de vehículos con sus inspecciones
const vehiclesData = ref<Array<{
    vehicle_id: string;
    vehicle_license_plate: string;
    inspections_in_month: number;
    inspections_other: number;
    total_inspections: number;
}>>([]);

// Formulario de búsqueda
const formSearch = ref({
    month: new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date()) as string | null,
    vehicle_id: null as string | null,
});

// Función para obtener la data desde el endpoint
const fetchData = async () => {
    loading.vehicleInspectionsComparison = true;
    const { data, response } = await useApi<any>(
        createUrl(`/dashboard/vehicleInspectionsComparison`, {
            query: {
                company_id: authenticationStore.company.id,
                month: formSearch.value.month,
                vehicle_id: formSearch.value.vehicle_id?.value,
            },
        })
    );
    loading.vehicleInspectionsComparison = false;
    if (response.value?.ok && data.value) {
        vehiclesData.value = data.value.inspection_count;
    }
};

fetchData();

// Calculamos el máximo número de inspecciones (entre ambas series)
const maxInspection = computed(() => {
    const arr = vehiclesData.value.flatMap(v => [v.inspections_in_month]);
    return arr.length > 0 ? Math.max(...arr) : 0;
});

// Definición de las series, convirtiendo los valores a enteros (en caso de decimales)
const series = computed(() => [
    {
        name: 'Inspecciones en Mes',
        data: vehiclesData.value.map(vehicle => parseInt(vehicle.inspections_in_month.toString(), 10) || 0),
    },
]);

// Configuración de colores y estilos para la gráfica
const chartColors = {
    series1: '#FFB400', // Color para "Inspecciones en Mes"
    series2: '#9055FD', // Color para "Inspecciones Otros"
};

const headingColor = 'rgba(var(--v-theme-on-background), var(--v-high-emphasis-opacity))';
const labelColor = 'rgba(var(--v-theme-on-background), var(--v-medium-emphasis-opacity))';
const borderColor = 'rgba(var(--v-border-color), var(--v-border-opacity))';

// Configuración de la gráfica con ajuste en el eje Y:
// Si el máximo es <=1 (pocas inspecciones), se fuerza tickAmount=2 y max igual al valor máximo
const shipmentConfig = computed(() => ({
    chart: {
        type: 'bar', // Gráfica de barras
        stacked: false,
        parentHeightOffset: 0,
        toolbar: { show: false },
        zoom: { enabled: false },
    },
    stroke: { curve: 'smooth', width: 3 },
    legend: { show: true, position: 'bottom' },
    colors: [chartColors.series1, chartColors.series2],
    plotOptions: {
        bar: {
            columnWidth: '50%',
            borderRadius: 5,
        },
    },
    xaxis: {
        // Se usan las placas de los vehículos como categorías
        categories: vehiclesData.value.map(vehicle => vehicle.vehicle_license_plate) || [],
        labels: {
            style: {
                colors: labelColor,
                fontSize: '13px',
                fontWeight: 400,
            },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
    },
    yaxis: {
        min: 0,
        max: maxInspection.value <= 1 ? maxInspection.value : undefined,
        tickAmount: maxInspection.value <= 1 ? 1 : 2,
        labels: {
            style: {
                colors: labelColor,
                fontSize: '13px',
                fontWeight: 400,
            },
            formatter(val: number) {
                // Se redondea el valor para mostrar solo enteros
                return `${Math.round(val)} inspecciones`;
            },
        },
    },
}));
</script>

<template>
    <AppCardActions title="Resumen de inspecciones por mes" actionRefresh @refresh="fetchData"
        :loading="loading.vehicleInspectionsComparison">
        <VCardText v-if="!loading.vehicleInspectionsComparison">
            <VRow>
                <!-- Control para seleccionar el mes -->
                <VCol cols="12" md="5">
                    <AppSelect clearable v-model="formSearch.month" label="Mes" placeholder="Todos" :items="[]" />
                </VCol>
                <!-- Control para seleccionar la placa del vehículo -->
                <VCol cols="12" md="5">
                    <SelectPlateVehicleForm clearable label="Placa del vehículo" v-model="formSearch.vehicle_id" />
                </VCol>
                <VCol cols="12" md="2" class="mt-7">
                    <VBtn icon size="30" @click="fetchData">
                        <VIcon icon="tabler-search"></VIcon>
                    </VBtn>
                </VCol>
            </VRow>
        </VCardText>
        <VCardText>
            <VueApexCharts v-if="!loading.vehicleInspectionsComparison" id="shipment-statistics" type="bar" height="320"
                :options="shipmentConfig" :series="series" />
        </VCardText>
    </AppCardActions>
</template>

<style lang="scss">
@use "@core/scss/template/libs/apex-chart";

.v-btn-group--divided .v-btn:not(:last-child) {
    border-inline-end-color: rgba(var(--v-theme-primary), 0.5);
}

#shipment-statistics {
    .apexcharts-legend-text {
        font-size: 16px !important;
    }

    .apexcharts-legend-series {
        border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
        border-radius: 0.375rem;
        block-size: 83%;
        padding-block: 4px;
        padding-inline: 16px 12px;
    }
}
</style>
