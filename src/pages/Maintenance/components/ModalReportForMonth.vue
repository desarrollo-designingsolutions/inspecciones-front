<script setup lang="ts">
import { useAuthenticationStore } from "@/stores/useAuthenticationStore";
import type { VForm } from 'vuetify/components/VForm';

const authenticationStore = useAuthenticationStore();
const { toast } = useToast()

const emit = defineEmits()

const isDialogVisible = ref(false)
const loadingReport = ref(false)

const form = ref({
  month: null,
  year: null,
  license_plate: null,
});

const months = ref([
  { value: 1, title: "Enero" },
  { value: 2, title: "Febrero" },
  { value: 3, title: "Marzo" },
  { value: 4, title: "Abril" },
  { value: 5, title: "Mayo" },
  { value: 6, title: "Junio" },
  { value: 7, title: "Julio" },
  { value: 8, title: "Agosto" },
  { value: 9, title: "Septiembre" },
  { value: 10, title: "Octubre" },
  { value: 11, title: "Noviembre" },
  { value: 12, title: "Diciembre" }
]);

const years = ref([
  { value: new Date().getFullYear(), title: new Date().getFullYear() },
  { value: new Date().getFullYear() - 1, title: new Date().getFullYear() - 1 },
]);

const handleClearForm = (): void => {
  form.value.month = null;
  form.value.year = new Date().getFullYear();
  form.value.license_plate = null;
};

const handleIsDialogVisible = () => {
  isDialogVisible.value = !isDialogVisible.value;
};

const maintenance_id = ref();

const openModal = async (license_plate: any, id: any) => {
  handleClearForm();
  form.value.license_plate = license_plate
  maintenance_id.value = id;
  handleIsDialogVisible();
};

const formValidation = ref<VForm>()

const handleSubmit = async () => {
  const validation = await formValidation.value?.validate()
  if (validation?.valid) {
    loadingReport.value = true;
    emit('loading', { maintenance_id: maintenance_id.value, loading: true });

    console.log(form.value.license_plate?.value)

    const url = "/maintenance/pdfReportExport";

    const { data, response } = await useAxios(url).post({
      company_id: authenticationStore.company.id,
      month: form.value.month,
      year: form.value.year,
      license_plate: form.value.license_plate?.title,
      vehicle_id: form.value.license_plate?.value,
    })

    if (response.status == 200 && data && data.code == 200) {
      descargarArchivo(data.path, 'pdf.pdf')
    }
    loadingReport.value = false;
    emit('loading', { maintenance_id: maintenance_id.value, loading: false });
    handleIsDialogVisible();
  }
  else {
    toast('Faltan Campos Por Diligenciar', '', 'danger')
  }
};

const company = {
  company_id: authenticationStore.company.id,
}

defineExpose({
  openModal,
});
</script>

<template>
  <VDialog v-model="isDialogVisible" max-width="50rem" persistent transition="dialog-transition">
    <DialogCloseBtn @click="handleIsDialogVisible()" />

    <VCard :loading="loadingReport" :disabled="loadingReport">
      <div>
        <VToolbar color="primary">
          <VToolbarTitle>
            Generar Informe
          </VToolbarTitle>
        </VToolbar>
      </div>

      <VCardText class="pa-sm-10 pa-2">
        <VForm ref="formValidation" @submit.prevent="() => { }">
          <VRow>
            <VCol cols="4">
              <AppSelect label="Mes" v-model="form.month" :items="months" :requiredField="true"
                :rules="[requiredValidator]" clearable />
            </VCol>

            <VCol cols="4">
              <AppSelect label="Año" v-model="form.year" :items="years" :requiredField="true"
                :rules="[requiredValidator]" clearable />
            </VCol>

            <VCol cols="4">
              <AppSelectRemote disabled label="Placa del vehículo" v-model="form.license_plate"
                url="/selectInfinitePlateVehicle" arrayInfo="plateVehicle" :requiredField="true"
                :rules="[requiredValidator]" clearable :params="company">
              </AppSelectRemote>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>

      <VCardText class="d-flex align-right justify-end gap-4">
        <VBtn color="secondary" @click="handleIsDialogVisible()" :loading="loadingReport" :disabled="loadingReport">
          Cerrar
        </VBtn>
        <VBtn prepend-icon="tabler-device-floppy" @click="handleSubmit()" :loading="loadingReport"
          :disabled="loadingReport">
          Generar
        </VBtn>
      </VCardText>
    </VCard>
  </VDialog>
</template>
