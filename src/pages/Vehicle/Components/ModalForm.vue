<script setup lang="ts">
import { useAuthenticationStore } from "@/stores/useAuthenticationStore";

const authenticationStore = useAuthenticationStore();
const isDialogVisible = ref(false)
const loadingReport = ref(false)

const form = ref({
  month: null,
  year: 2025,
  license_plate: null,
  inspectionType: null
});

const months = ref([
  { value: "Enero", title: "Enero" },
  { value: "Febrero", title: "Febrero" },
  { value: "Marzo", title: "Marzo" },
  { value: "Abril", title: "Abril" },
  { value: "Mayo", title: "Mayo" },
  { value: "Junio", title: "Junio" },
  { value: "Julio", title: "Julio" },
  { value: "Agosto", title: "Agosto" },
  { value: "Septiembre", title: "Septiembre" },
  { value: "Octubre", title: "Octubre" },
  { value: "Noviembre", title: "Noviembre" },
  { value: "Diciembre", title: "Diciembre" }
]);

const years = ref([
  { value: new Date().getFullYear(), title: new Date().getFullYear() },
  { value: new Date().getFullYear() - 1, title: new Date().getFullYear() - 1 },
]);

const handleClearForm = (): void => {
  form.value.month = null;
  form.value.year = 2025;
  form.value.license_plate = null;
  form.value.inspectionType = null;
};

const handleIsDialogVisible = (isVisible: boolean = false) => {
  isDialogVisible.value = isVisible;
};

const openModal = async () => {
  handleClearForm();
  handleIsDialogVisible(true);
};

const handleSubmit = async () => {
  loadingReport.value = true;
  const { data, response } = await useApi("/vehicle/excelReportExport").post({
    company_id: authenticationStore.company.id,
    month: form.value.month,
    year: form.value.year,
    license_plate: form.value.license_plate?.title,
    license_plate_id: form.value.license_plate?.value,
    inspectionType: form.value.inspectionType?.title,
    inspectionType_id: form.value.inspectionType?.value,

  })
  loadingReport.value = false;

  if (response.value?.ok && data.value) {
    handleIsDialogVisible(false);
    downloadExcelBase64(data.value.excel, "Reporte de vehículos")
  }
};

defineExpose({
  openModal,
});
</script>

<template>
  <VDialog v-model="isDialogVisible" max-width="50rem" persistent transition="dialog-transition">
    <DialogCloseBtn @click="handleIsDialogVisible()" />

    <VCard>
      <div>
        <VToolbar color="primary">
          <VToolbarTitle>
            Generar reporte
          </VToolbarTitle>
        </VToolbar>
      </div>

      <VCardText class="pa-sm-10 pa-2">
        <VForm>
          <VRow>
            <VCol cols="3">
              <AppSelect label="Mes" v-model="form.month" :items="months" clearable />
            </VCol>

            <VCol cols="3">
              <AppSelect label="Año" v-model="form.year" :items="years" clearable />
            </VCol>

            <VCol cols="3">
              <AppSelectRemote label="Placa del vehículo" v-model="form.license_plate" url="/selectInfinitePlateVehicle"
                arrayInfo="plateVehicle">
              </AppSelectRemote>
            </VCol>
            
            <VCol cols="3">
              <AppSelectRemote label="Tipo de inspecciones" v-model="form.inspectionType" url="/selectInspectionType"
                arrayInfo="inspectionType">
              </AppSelectRemote>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>

      <VCardText class="d-flex align-right justify-end gap-4">
        <VBtn color="secondary" @click="handleIsDialogVisible()">
          Cerrar
        </VBtn>
        <VBtn prepend-icon="tabler-device-floppy" @click="handleSubmit()" :loading="loadingReport">
          Generar
        </VBtn>
      </VCardText>
    </VCard>
  </VDialog>
</template>
