<script lang="ts" setup>
import { useToast } from '@/composables/useToast';
import IErrorsBack from "@/interfaces/Axios/IErrorsBack";
import { router } from '@/plugins/1.router';
import { useAuthenticationStore } from "@/stores/useAuthenticationStore";
import type { VForm } from 'vuetify/components/VForm';

definePage({
  path: "Vehicle-form/:action/:id?",
  name: "Vehicle-Form",
  meta: {
    redirectIfLoggedIn: true,
    requiresAuth: true,
    requiredPermission: "vehicle.list",
  },
});

const authenticationStore = useAuthenticationStore();
const { company } = storeToRefs(authenticationStore)
const { toast } = useToast()
const errorsBack = ref<IErrorsBack>({});
const disabledFiledsView = ref<boolean>(false);
const route = useRoute()
const refFormGeneralInformation = ref<VForm>()
const refFormPhoto = ref<VForm>()
const loading = reactive({
  form: false,
  cities: false,
})
const form = ref({
  id: null as string | null,
  company_id: null as string | null,
  license_plate: null as string | null,
  type_vehicle_id: null as string | null,
  date_registration: null as string | null,
  brand_vehicle_id: null as string | null,
  engine_number: null as string | null,
  state_id: null as number | null,
  city_id: null as number | null,
  model: null as string | null,
  vin_number: null as string | null,
  load_capacity: null as string | null,
  client_id: null as string | null,
  gross_vehicle_weight: null as string | null,
  passenger_capacity: null as string | null,
  number_axles: null as string | null,
  current_mileage: null as string | null,
  have_trailer: false as boolean,
  trailer: null as string | null,
  vehicle_structure_id: null as string | null,

  photo_front: null as null | File,
  photo_rear: null as null | File,
  photo_right_side: null as null | File,
  photo_left_side: null as null | File,

})

const clearForm = () => {
  for (const key in form.value) {
    form.value[key] = null
  }
  form.value.have_trailer = false
}

const fetchDataForm = async () => {

  form.value.id = route.params.id || null

  const url = form.value.id ? `/vehicle/${form.value.id}/edit` : `/vehicle/create`

  loading.form = true
  const { data, response } = await useApi<any>(
    createUrl(url, {
      query: {
        company_id: company.value.id
      },
    })
  );
  loading.form = false

  if (response.value?.ok && data.value) {

    states.value = data.value.states
    vehicle_structures.value = data.value.vehicle_structures

    //formulario 
    if (data.value.form) {
      form.value = data.value.form
    }
  }
}

const updateValidationToFalse = () => {
  tabs.value.forEach(tab => {
    tab.errorsValidations = false;
  });
}

const allValidations = async () => {
  updateValidationToFalse()
  let exito = []
  const validation = await refFormPhoto.value?.validate()

  console.log("validation", validation);

  if (validation) {
    exito.push(validation?.valid)
    tabs.value[0].errorsValidations = !validation?.valid
  }

  const validation2 = await refFormGeneralInformation.value?.validate()
  console.log("validation2", validation2);

  if (validation2) {
    exito.push(validation2?.valid)
    tabs.value[2].errorsValidations = !validation2?.valid
  }

  // Verificar si hay algún false en el array exito
  const exitoFinal = exito.every(item => item === true);

  return exitoFinal;
}

const submitForm = async (isCreateAndNew: boolean = false) => {
  const validation = await allValidations()
  if (validation) {

    form.value.company_id = authenticationStore.company.id;

    const url = form.value.id ? `/vehicle/update/${form.value.id}` : `/vehicle/store`

    const formData = new FormData();
    for (const key in form.value) {
    }

    formData.append("id", String(form.value.id))
    formData.append("company_id", String(form.value.company_id))
    formData.append("license_plate", String(form.value.license_plate))
    formData.append("type_vehicle_id", String(form.value.type_vehicle_id.value))
    formData.append("date_registration", String(form.value.date_registration))
    formData.append("brand_vehicle_id", String(form.value.brand_vehicle_id.value))
    formData.append("engine_number", String(form.value.engine_number))
    formData.append("state_id", String(form.value.state_id))
    formData.append("city_id", String(form.value.city_id))
    formData.append("model", String(form.value.model))
    formData.append("vin_number", String(form.value.vin_number))
    formData.append("load_capacity", String(form.value.load_capacity))
    formData.append("client_id", String(form.value.client_id.value))
    formData.append("gross_vehicle_weight", String(form.value.gross_vehicle_weight))
    formData.append("passenger_capacity", String(form.value.passenger_capacity))
    formData.append("number_axles", String(form.value.number_axles))
    formData.append("current_mileage", String(form.value.current_mileage))
    formData.append("have_trailer", String(form.value.have_trailer))
    formData.append("trailer", String(form.value.trailer))
    formData.append("vehicle_structure_id", String(form.value.vehicle_structure_id))
    formData.append("photo_front", form.value.photo_front)
    formData.append("photo_rear", form.value.photo_rear)
    formData.append("photo_right_side", form.value.photo_right_side)
    formData.append("photo_left_side", form.value.photo_left_side)

    loading.form = true;
    const { data, response } = await useApi(url).post(formData);
    loading.form = false;



    if (response.value?.ok && data.value) {

      if (data.value.code == 200) {

        if (isCreateAndNew) {
          clearForm(); // Limpiar el formulario si es "Crear y crear otro"
        } else {
          router.push({ name: 'Vehicle-List' }); // Redirigir si es "Crear"
        }
      }
    }
    if (data.value.code === 422) errorsBack.value = data.value.errors ?? {};

  }
  else {
    toast('Faltan Campos Por Diligenciar', '', 'danger')
  }
}

if (route.params.action == 'view') disabledFiledsView.value = true


// Computed que verifica si al menos uno de los valores es true
const isLoading = computed(() => {
  return Object.values(loading).some(value => value);
});

onMounted(async () => {
  clearForm()
  await fetchDataForm()

})


//TABS
const currentTab = ref(0)

const tabs = ref([
  {
    title: "Información general",
    show: true,
    errorsValidations: false,
  },
  {
    title: "Documentos del vehículo",
    show: true,
    errorsValidations: false,
  },
  {
    title: "Fotografias del vehículo",
    show: true,
    errorsValidations: false,
  },
  {
    title: "Elementos de emergencia",
    show: true,
    errorsValidations: false,
  },
])

//VALIDATIOS FIELDS
const ruleFieldLicensePlate = [
  (value: string) => requiredValidator(value),
  (value: string) => maxCharacters(value, 6),
]


// VEHICLES_STRUCTURE
const vehicle_structures = ref<Array<{ value: string, title: string }>>([])

// STATES AND CITIES
const states = ref<Array<{ value: string, title: string }>>([])
const cities = ref<Array<{ value: string, title: string }>>([])

const changeState = async (event: Event) => {
  form.value.city_id = null;

  loading.cities = true;
  const { data, response } = await useApi(`/selectCities/${event}`).get();
  loading.cities = false;

  if (response.value?.ok && data.value) {
    cities.value = data.value.cities;
  }
}

//FILES 3 TAB 
const inputFilePhotoFront = ref(useFileUpload())
inputFilePhotoFront.value.allowedExtensions = ["jpg", "png"];
watch(inputFilePhotoFront.value, (newVal, oldVal) => {
  if (newVal.imageFile) form.value.photo_front = newVal.imageFile
})

const inputFilePhotoRear = ref(useFileUpload())
inputFilePhotoRear.value.allowedExtensions = ["jpg", "png"];
watch(inputFilePhotoRear.value, (newVal, oldVal) => {
  if (newVal.imageFile) form.value.photo_rear = newVal.imageFile
})

const inputFilePhotoRightSide = ref(useFileUpload())
inputFilePhotoRightSide.value.allowedExtensions = ["jpg", "png"];
watch(inputFilePhotoRightSide.value, (newVal, oldVal) => {
  if (newVal.imageFile) form.value.photo_right_side = newVal.imageFile
})

const inputFilePhotoLeftSide = ref(useFileUpload())
inputFilePhotoLeftSide.value.allowedExtensions = ["jpg", "png"];
watch(inputFilePhotoLeftSide.value, (newVal, oldVal) => {
  if (newVal.imageFile) form.value.photo_left_side = newVal.imageFile
})
</script>

<template>
  <div>
    <VCard :disabled="loading.form" :loading="loading.form">
      <VCardTitle class="d-flex justify-space-between">
        <span>
          Información del vehiculo
        </span>
      </VCardTitle>

      <VCardText>
        <VTabs v-model="currentTab">
          <VTab class="text-none" v-for="(item, index) in tabs" :key="index" v-show="item.show">
            <VIcon start :icon="!item.errorsValidations ? '' : 'tabler-alert-circle-filled'"
              :color="!item.errorsValidations ? '' : 'error'" />
            {{ item.title }}
          </VTab>
        </VTabs>
      </VCardText>

      <VCardText>
        <div v-show="currentTab == 0">
          <VForm ref="refFormGeneralInformation" @submit.prevent="() => { }" :disabled="disabledFiledsView">
            <VRow>
              <VCol cols="12" sm="6">
                <AppTextField :requiredField="true" label="Número de placa" v-model="form.license_plate" clearable
                  :errorMessages="errorsBack.license_plate" @input="errorsBack.license_plate = ''"
                  :rules="ruleFieldLicensePlate">
                </AppTextField>
              </VCol>
              <VCol cols="12" md="6">
                <SelectTypeVehicleForm :rules="[requiredValidator]" :requiredField="true" label="Clase de vehículo"
                  v-model="form.type_vehicle_id" :errorMessages="errorsBack.type_vehicle_id"
                  @input="errorsBack.type_vehicle_id = ''" />
              </VCol>

              <VCol cols="12" md="6">
                <AppDateTimePicker clearable :requiredField="true" label="Fecha de matrícula"
                  v-model="form.date_registration" :errorMessages="errorsBack.date_registration"
                  @input="errorsBack.date_registration = ''" :config="{ dateFormat: 'Y-m-d' }" />
              </VCol>

              <VCol cols="12" md="6">
                <SelectBrandVehicleForm :rules="[requiredValidator]" :requiredField="true" label="Marca de vehículo"
                  v-model="form.brand_vehicle_id" :errorMessages="errorsBack.brand_vehicle_id"
                  @input="errorsBack.brand_vehicle_id = ''" />
              </VCol>

              <VCol cols="12" sm="6">
                <AppTextField :requiredField="true" label="Número de motor" v-model="form.engine_number" clearable
                  :errorMessages="errorsBack.engine_number" @input="errorsBack.engine_number = ''"
                  :rules="[requiredValidator]">
                </AppTextField>
              </VCol>

              <VCol cols="12" sm="6">
                <AppAutocomplete :requiredField="true" clearable :items="states" v-model="form.state_id"
                  label="Departamento de operación" @update:model-value="changeState($event)"
                  :error-messages="errorsBack.state_id" @input="errorsBack.state_id = ''" :rules="[requiredValidator]">
                </AppAutocomplete>
              </VCol>

              <VCol cols="12" sm="6">
                <AppAutocomplete :loading="loading.cities" :requiredField="true" clearable :items="cities"
                  v-model="form.city_id" label="Ciudad" :error-messages="errorsBack.city_id"
                  @input="errorsBack.city_id = ''" :rules="[requiredValidator]">
                </AppAutocomplete>
              </VCol>

              <VCol cols="12" sm="6">
                <AppTextField :requiredField="true" label="Modelo" v-model="form.model" clearable
                  :errorMessages="errorsBack.model" @input="errorsBack.model = ''" :rules="[requiredValidator]">
                </AppTextField>
              </VCol>

              <VCol cols="12" sm="6">
                <AppTextField :requiredField="true" label="Número de VIN" v-model="form.vin_number" clearable
                  :errorMessages="errorsBack.vin_number" @input="errorsBack.vin_number = ''"
                  :rules="[requiredValidator]">
                </AppTextField>
              </VCol>
              <VCol cols="12" sm="6">
                <AppTextField :requiredField="true" label="Capacidad de carga (kg)" v-model="form.load_capacity"
                  clearable :errorMessages="errorsBack.load_capacity" @input="errorsBack.load_capacity = ''"
                  :rules="[requiredValidator]">
                </AppTextField>
              </VCol>

              <VCol cols="12" md="6">
                <SelectClientForm :rules="[requiredValidator]" :requiredField="true" label="Cliente"
                  v-model="form.client_id" :errorMessages="errorsBack.client_id" @input="errorsBack.client_id = ''" />
              </VCol>

              <VCol cols="12" sm="6">
                <AppTextField :requiredField="true" label="Peso bruto vehicular (kg)"
                  v-model="form.gross_vehicle_weight" clearable :errorMessages="errorsBack.gross_vehicle_weight"
                  @input="errorsBack.gross_vehicle_weight = ''" :rules="[requiredValidator]">
                </AppTextField>
              </VCol>

              <VCol cols="12" sm="6">
                <AppTextField :requiredField="true" label="Capacidad de pasajeros" v-model="form.passenger_capacity"
                  clearable :errorMessages="errorsBack.passenger_capacity" @input="errorsBack.passenger_capacity = ''"
                  :rules="[requiredValidator]">
                </AppTextField>
              </VCol>

              <VCol cols="12" sm="6">
                <AppTextField @keypress="onlyNumbersKeyPress" :requiredField="true" label="Número de ejes"
                  v-model="form.number_axles" clearable :errorMessages="errorsBack.number_axles"
                  @input="errorsBack.number_axles = ''" :rules="[requiredValidator]">
                </AppTextField>
              </VCol>

              <VCol cols="12" sm="6">
                <AppTextField :requiredField="true" label="Kilometraje actual del vehiculo"
                  v-model="form.current_mileage" clearable :errorMessages="errorsBack.current_mileage"
                  @input="errorsBack.current_mileage = ''" :rules="[requiredValidator]">
                </AppTextField>
              </VCol>

              <VCol cols="12" sm="6">
                <div class="d-flex">
                  <VSwitch v-model="form.have_trailer" label="¿Tiene un trailer?" />
                  <div class="ml-2 w-100">
                    <AppTextField v-if="form.have_trailer" :requiredField="true" label="Trailer" v-model="form.trailer"
                      clearable :errorMessages="errorsBack.trailer" @input="errorsBack.trailer = ''"
                      :rules="[requiredValidator]">
                    </AppTextField>
                  </div>
                </div>
              </VCol>

              <VCol cols="12" sm="6">
                <AppAutocomplete :requiredField="true" clearable :items="vehicle_structures"
                  v-model="form.vehicle_structure_id" label="Estructura del vehículo"
                  :error-messages="errorsBack.vehicle_structure_id" @input="errorsBack.vehicle_structure_id = ''"
                  :rules="[requiredValidator]">
                </AppAutocomplete>
              </VCol>

            </VRow>

          </VForm>
        </div>

        <div v-show="currentTab == 2">
          <VForm ref="refFormPhoto" @submit.prevent="() => { }" :disabled="disabledFiledsView">
            <VRow>
              <VCol cols="12" sm="6">
                <AppFileInput :requiredField="form.id ? false : true" clearable :loading="inputFilePhotoFront.loading"
                  label="Foto frontal" :label2="form.photo_front ? '1 archivo agregado' : ''"
                  @change="inputFilePhotoFront.handleImageSelected" :key="inputFilePhotoFront.key"
                  :error-messages="errorsBack.photo_front" @input="errorsBack.photo_front = ''"
                  :rules="[form.id ? true : requiredValidator]"></AppFileInput>
              </VCol>
              <VCol cols="12" sm="6">
                <AppFileInput :requiredField="form.id ? false : true" clearable :loading="inputFilePhotoRear.loading"
                  label="Foto reverso" :label2="form.photo_rear ? '1 archivo agregado' : ''"
                  @change="inputFilePhotoRear.handleImageSelected" :key="inputFilePhotoRear.key"
                  :error-messages="errorsBack.photo_rear" @input="errorsBack.photo_rear = ''"
                  :rules="[form.id ? true : requiredValidator]"></AppFileInput>
              </VCol>
              <VCol cols="12" sm="6">
                <AppFileInput :requiredField="form.id ? false : true" clearable
                  :loading="inputFilePhotoRightSide.loading" label="Foto  lado derecho"
                  :label2="form.photo_right_side ? '1 archivo agregado' : ''"
                  @change="inputFilePhotoRightSide.handleImageSelected" :key="inputFilePhotoRightSide.key"
                  :error-messages="errorsBack.photo_right_side" @input="errorsBack.photo_right_side = ''"
                  :rules="[form.id ? true : requiredValidator]"></AppFileInput>
              </VCol>
              <VCol cols="12" sm="6">
                <AppFileInput :requiredField="form.id ? false : true" clearable
                  :loading="inputFilePhotoLeftSide.loading" label="Foto  lado izquierdo"
                  :label2="form.photo_left_side ? '1 archivo agregado' : ''"
                  @change="inputFilePhotoLeftSide.handleImageSelected" :key="inputFilePhotoLeftSide.key"
                  :error-messages="errorsBack.photo_left_side" @input="errorsBack.photo_left_side = ''"
                  :rules="[form.id ? true : requiredValidator]"></AppFileInput>
              </VCol>
            </VRow>
          </VForm>
        </div>
      </VCardText>

      <VCardText class="d-flex justify-end gap-3 flex-wrap mt-5">
        <BtnBack :disabled="isLoading" :loading="isLoading" />
        <BtnSave v-if="!disabledFiledsView" :disabled="isLoading" :loading="isLoading" @execute="submitForm" />
      </VCardText>
    </VCard>
  </div>
</template>
