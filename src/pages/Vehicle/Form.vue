<script lang="ts" setup>
import { useToast } from '@/composables/useToast';
import IErrorsBack from "@/interfaces/Axios/IErrorsBack";
import { router } from '@/plugins/1.router';
import { useAuthenticationStore } from "@/stores/useAuthenticationStore";
import moment from "moment";
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
const refFormTypeDocument = ref<VForm>()
const refFormEmergencyElement = ref<VForm>()
const loading = reactive({
  form: false,
  cities: false,
})

interface ITypeDocument {
  id: null | string,
  vehicle_id: null | string,
  type_document_id: null | string,
  document_number: null | string,
  date_issue: null | string,
  expiration_date: null | string,
  photo: null | string,
}
interface IEmergencyElement {
  id: null | string,
  vehicle_id: null | string,
  emergency_element_id: null | string,
  quantity: null | string,
  expiration_date: null | string,
}

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

  type_documents: [] as Array<ITypeDocument>,
  emergency_elements: [] as Array<IEmergencyElement>,

  photo_front: null as null | File,
  photo_rear: null as null | File,
  photo_right_side: null as null | File,
  photo_left_side: null as null | File,

})

const typeInspectionInputs = ref([])

const typeGroups = ref<Array<number | string>>([])

const clearForm = () => {

  currentTab.value = 0;

  //Tab 1
  for (const key in form.value) {
    form.value[key] = null
  }
  form.value.have_trailer = false

  //Tab 2
  form.value.type_documents = []
  form.value.type_documents.push({
    id: null,
    vehicle_id: null,
    type_document_id: null,
    document_number: null,
    date_issue: null,
    expiration_date: null,
    photo: null,
  } as ITypeDocument)

  //Tab 4
  form.value.emergency_elements = []
  form.value.emergency_elements.push({
    id: null,
    vehicle_id: null,
    emergency_element_id: null,
    quantity: null,
  } as IEmergencyElement)


  inputFilePhotoFront.value.clearData();
  inputFilePhotoRear.value.clearData();
  inputFilePhotoRightSide.value.clearData();
  inputFilePhotoLeftSide.value.clearData();
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


  if (response.value?.ok && data.value) {

    states.value = data.value.states
    vehicle_structures.value = data.value.vehicle_structures
    typeInspectionInputs.value = data.value.type_inspection_inputs

    //formulario 
    if (data.value.form) {
      form.value = data.value.form
      typeGroups.value = data.value.form.type_groups

      const formClone = JSON.parse(JSON.stringify(data.value.form))

      if (data.value.form.id) {
        await changeState(formClone.state_id)

        form.value.state_id = formClone.state_id
        form.value.city_id = formClone.city_id
      }
    }

    if (form.value.type_documents.length == 0) {
      form.value.type_documents.push({
        id: null,
        vehicle_id: null,
        type_document_id: null,
        document_number: null,
        date_issue: null,
        expiration_date: null,
        photo: null,
      } as ITypeDocument)
    }

    if (form.value.emergency_elements.length == 0) {
      form.value.emergency_elements.push({
        id: null,
        vehicle_id: null,
        emergency_element_id: null,
        quantity: null,
      } as IEmergencyElement)
    }

    loading.form = false
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
  const validation1 = await refFormGeneralInformation.value?.validate()

  if (validation1) {
    exito.push(validation1?.valid)
    tabs.value[0].errorsValidations = !validation1?.valid
  }

  const validation2 = await refFormTypeDocument.value?.validate()

  if (validation2) {
    exito.push(validation2?.valid)
    tabs.value[1].errorsValidations = !validation2?.valid
  }

  const validation3 = await refFormPhoto.value?.validate()

  if (validation3) {
    exito.push(validation3?.valid)
    tabs.value[2].errorsValidations = !validation3?.valid
  }

  const validation4 = await refFormEmergencyElement.value?.validate()

  if (validation4) {
    exito.push(validation4?.valid)
    tabs.value[3].errorsValidations = !validation4?.valid
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
    formData.append("type_documents", JSON.stringify(form.value.type_documents))
    formData.append("emergency_elements", JSON.stringify(form.value.emergency_elements))
    formData.append("type_groups", JSON.stringify(typeGroups.value))

    formData.append('cantfiles', String(form.value.type_documents?.length))
    for (let i = 0; i < form.value.type_documents.length; i++) {
      formData.append('file_id' + i, form.value.type_documents[i].id)
      formData.append('file_vehicle_id' + i, form.value.type_documents[i].vehicle_id)
      formData.append('file_type_document_id' + i, form.value.type_documents[i].type_document_id.value)
      formData.append('file_document_number' + i, form.value.type_documents[i].document_number)
      formData.append('file_date_issue' + i, form.value.type_documents[i].date_issue)
      formData.append('file_expiration_date' + i, form.value.type_documents[i].expiration_date)
      formData.append('file_photo' + i, form.value.type_documents[i].photo ? form.value.type_documents[i].photo : null)
    }

    loading.form = true;
    const { data, response } = await useApi(url).post(formData);
    loading.form = false;



    if (response.value?.ok && data.value) {

      if (data.value.code == 200) {

        if (isCreateAndNew) {
          clearForm();
          route.params.id = null;
          router.push({ name: "Vehicle-Form", params: { action: 'create', id: null } })
        } else {
          router.push({ name: 'Vehicle-List' }); // Redirigir si es "Crear"
        }
      }
    }

    if (data.value.code === 422) {
      const formattedErrors: any = {};
      Object.keys(data.value.errors).forEach(key => {
        // Transforma "type_documents.0.expiration_date" en "type_documents[0].expiration_date"
        const newKey = key.replace(/\.(\d+)\./g, '[$1].');
        formattedErrors[newKey] = data.value.errors[key];
      });
      errorsBack.value = formattedErrors;
    }

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
  {
    title: "Tipos de inspección",
    show: true,
    errorsValidations: false,
  },
])

const models = computed(() => {
  const startYear = 1950;
  const endYear = new Date().getFullYear() + 1; // Año actual + 1
  const years = [];

  for (let year = endYear; year >= startYear; year--) {
    years.push(year);
  }

  return years;
});



//VALIDATIOS FIELDS
const ruleFieldLicensePlate = [
  (value: string) => requiredValidator(value),
  (value: string) => maxCharacters(value, 6),
]

const characterLimitRules = [
  (value: string) => requiredValidator(value),
  (value: string) => maxCharacters(value, 255),
]

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1; // Los meses van de 0 a 11, por lo que sumamos 1
const currentDay = now.getDate();



const fileValidationRules = [
  (value: string) => value || 'El archivo es obligatorio.',
];

const checkLicensePlate = async () => {
  if (form.value.license_plate) {
    const url = '/vehicle/validateLicensePlate'

    const { response, data } = await useApi(url).post({
      id: form.value.id,
      license_plate: form.value.license_plate,
      company_id: company.value.id,
    });

    if (response.value?.ok && data.value.exists) {
      errorsBack.value.license_plate = data.value.message_licences;
    } else {
      errorsBack.value.license_plate = "";
    }
  }
};

const updateEndDate = async (event: any, item: any) => {
  return item.expiration_date = moment(event, "YYYY-MM-DD")
    .add(1, "year")
    .format("YYYY-MM-DD");
};

const validationExpirationDate = (event: any, date: any, index: any) => {
  if (event) {
    let d1 = moment(date);
    let d2 = moment(event);
    errorsBack.value[`type_document_${index}`] = "";
    if (!d2.isAfter(d1))
      errorsBack.value[`type_document_${index}`] = `La fecha debe ser posterior a ${d1.format('YYYY-MM-DD')}`;
  }
}

// TAB 1
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
// TAB 2
const shouldShowDeleteButton = (typeArray: string) => {
  const visibleItems = form.value[typeArray].filter(item => !item.delete);
  return visibleItems.length > 1; // Mostrar el botón si hay más de un elemento visible
}

//DATA_ARRAY
const addDataArrayTypeDocument = async () => {
  const validation = await refFormTypeDocument.value?.validate()

  if (validation?.valid) {
    form.value.type_documents.push({
      id: null,
      vehicle_id: null,
      type_document_id: null,
      document_number: null,
      date_issue: null,
      expiration_date: null,
      photo: null,
    } as ITypeDocument)
  }
}

const deleteDataArrayTypeDocument = (index: number) => {
  form.value.type_documents.splice(index, 1);
}

//TAB 3 
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


//tab 4

//DATA_ARRAY
const addDataArrayEmergencyElement = async () => {
  const validation = await refFormEmergencyElement.value?.validate()

  if (validation?.valid) {
    form.value.emergency_elements.push({
      id: null,
      vehicle_id: null,
      emergency_element_id: null,
      quantity: null,
    } as IEmergencyElement)
  }
}

const deleteDataArrayEmergencyElement = (index: number) => {
  form.value.emergency_elements.splice(index, 1);
}

const changeFile = (e: any, item: any) => {
  const input = e.target as HTMLInputElement;
  item.photo = input.files[0];
}

// Computed to check if all inputs in an inspection are selected
const todosSeleccionados = (inspection) => {
  return inspection.inputs.every(input => typeGroups.value.includes(input.id));
}

// Method to toggle all inputs in an inspection
const toggleTodos = (inspection, event) => {
  const isChecked = event.target.checked;

  if (isChecked) {
    // Select all inputs that aren't already selected (except disabled ones)
    inspection.inputs.forEach(input => {
      if (!typeGroups.value.includes(input.id) && input.id !== 1) {
        typeGroups.value.push(input.id);
      }
    });
  } else {
    // Deselect all inputs from this inspection
    inspection.inputs.forEach(input => {
      const index = typeGroups.value.indexOf(input.id);
      if (index !== -1) {
        typeGroups.value.splice(index, 1);
      }
    });
  }
}

const expirationDateValidator = (value: string, dateIssue: string): true | string => {
  if (!value) {
    return 'La fecha de vencimiento es obligatoria.'
  }
  if (!dateIssue) {
    return true; // O podés marcar un error si fecha de expedición es obligatoria
  }
  const dIssue = moment(dateIssue, "YYYY-MM-DD");
  const dExpiration = moment(value, "YYYY-MM-DD");
  if (!dExpiration.isAfter(dIssue)) {
    return `La fecha debe ser posterior a ${dIssue.format('YYYY-MM-DD')}`;
  }
  return true;
};

const viewFile = (pathname: any) => {
  window.open(
    `${import.meta.env.VITE_API_BASE_BACK}/storage/${pathname}`,
    "_blank"
  );
};

</script>

<template>
  <div>
    <VCard :disabled="loading.form" :loading="loading.form">
      <VCardTitle class="d-flex justify-space-between">
        <span>
          Información del vehículo
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
                <AppTextField @blur="checkLicensePlate" :requiredField="true" label="Número de placa"
                  v-model="form.license_plate" clearable :maxlength="6" :errorMessages="errorsBack.license_plate"
                  @input="errorsBack.license_plate = ''" :rules="ruleFieldLicensePlate">
                </AppTextField>
              </VCol>
              <VCol cols="12" md="6">
                <SelectTypeVehicleForm :rules="[requiredValidator]" :requiredField="true" label="Clase de vehículo"
                  v-model="form.type_vehicle_id" :errorMessages="errorsBack.type_vehicle_id"
                  @input="errorsBack.type_vehicle_id = ''" />
              </VCol>

              <VCol cols="12" md="6">
                <AppDateTimePicker :rules="[requiredValidator]" :requiredField="true" clearable
                  :error-messages="errorsBack.date_registration" @input="errorsBack.date_registration = ''"
                  v-model="form.date_registration" label="Fecha de matrícula" :config="{
                    dateFormat: 'Y-m-d',
                    disable: [
                      { from: `${currentYear}-${(currentMonth).toString().padStart(2, '0')}-${(currentDay + 1).toString().padStart(2, '0')}`, to: '9999-12-31' }
                    ]
                  }" />
              </VCol>

              <VCol cols="12" md="6">
                <SelectBrandVehicleForm :rules="[requiredValidator]" :requiredField="true" label="Marca de vehículo"
                  v-model="form.brand_vehicle_id" :errorMessages="errorsBack.brand_vehicle_id"
                  @input="errorsBack.brand_vehicle_id = ''" />
              </VCol>

              <VCol cols="12" sm="6">
                <AppTextField :requiredField="true" label="Número de motor" v-model="form.engine_number" clearable
                  :errorMessages="errorsBack.engine_number" @input="errorsBack.engine_number = ''"
                  :rules="characterLimitRules">
                </AppTextField>
              </VCol>

              <VCol cols="12" sm="6">
                <AppAutocomplete :requiredField="true" clearable :items="states" v-model="form.state_id"
                  label="Departamento de operación" @update:model-value="changeState($event)"
                  :error-messages="errorsBack.state_id" @input="errorsBack.state_id = ''" :rules="[requiredValidator]">
                </AppAutocomplete>
              </VCol>

              <VCol cols="12" sm="6">
                <AppAutocomplete :disabled="cities.length <= 0 || disabledFiledsView" :requiredField="cities.length > 0"
                  :loading="loading.cities" clearable :items="cities" v-model="form.city_id" label="Ciudad de operación"
                  :error-messages="errorsBack.city_id" @input="errorsBack.city_id = ''" :rules="[requiredValidator]">
                </AppAutocomplete>
              </VCol>

              <VCol cols="12" sm="6">
                <!-- <AppTextField @keypress="onlyNumbersPositivesKeyPress" :requiredField="true" label="Modelo"
                  v-model="form.model" clearable :errorMessages="errorsBack.model" @input="errorsBack.model = ''"
                  :rules="[requiredValidator]">
                </AppTextField> -->
                <AppSelect :items="models" :requiredField="true" label="Modelo" v-model="form.model" clearable
                  :errorMessages="errorsBack.model" @input="errorsBack.model = ''" :rules="[requiredValidator]">
                </AppSelect>
              </VCol>

              <VCol cols="12" sm="6">
                <AppTextField :requiredField="true" label="Número de VIN" v-model="form.vin_number" clearable
                  :errorMessages="errorsBack.vin_number" @input="errorsBack.vin_number = ''"
                  :rules="characterLimitRules">
                </AppTextField>
              </VCol>
              <VCol cols="12" sm="6">
                <AppTextField @keypress="onlyNumbersPositivesKeyPress" :requiredField="true"
                  label="Capacidad de carga (kg)" v-model="form.load_capacity" clearable
                  :errorMessages="errorsBack.load_capacity" @input="errorsBack.load_capacity = ''"
                  :rules="[requiredValidator]">
                </AppTextField>
              </VCol>

              <VCol cols="12" md="6">
                <SelectClientForm :rules="[requiredValidator]" :requiredField="true" label="Cliente"
                  v-model="form.client_id" :errorMessages="errorsBack.client_id" @input="errorsBack.client_id = ''" />
              </VCol>

              <VCol cols="12" sm="6">
                <AppTextField @keypress="onlyNumbersPositivesKeyPress" :requiredField="true"
                  label="Peso bruto vehicular (kg)" v-model="form.gross_vehicle_weight" clearable
                  :errorMessages="errorsBack.gross_vehicle_weight" @input="errorsBack.gross_vehicle_weight = ''"
                  :rules="[requiredValidator]">
                </AppTextField>
              </VCol>

              <VCol cols="12" sm="6">
                <AppTextField @keypress="onlyNumbersPositivesKeyPress" :requiredField="true"
                  label="Capacidad de pasajeros" v-model="form.passenger_capacity" clearable
                  :errorMessages="errorsBack.passenger_capacity" @input="errorsBack.passenger_capacity = ''"
                  :rules="[requiredValidator]">
                </AppTextField>
              </VCol>

              <VCol cols="12" sm="6">
                <AppTextField @keypress="onlyNumbersPositivesKeyPress" :requiredField="true" label="Número de ejes"
                  v-model="form.number_axles" clearable :errorMessages="errorsBack.number_axles"
                  @input="errorsBack.number_axles = ''" :rules="[requiredValidator]">
                </AppTextField>
              </VCol>

              <VCol cols="12" sm="6">
                <AppTextField @keypress="onlyNumbersPositivesKeyPress" :requiredField="true"
                  label="Kilometraje actual del vehículo" v-model="form.current_mileage" clearable
                  :errorMessages="errorsBack.current_mileage" @input="errorsBack.current_mileage = ''"
                  :rules="[requiredValidator]">
                </AppTextField>
              </VCol>

              <VCol cols="12" sm="6">
                <div class="d-flex">
                  <VSwitch v-model="form.have_trailer" label="¿Tiene un trailer?" />
                  <div class="ml-2 w-100">
                    <AppTextField v-if="form.have_trailer" :requiredField="true" label="Número de placa trailer"
                      v-model="form.trailer" clearable :errorMessages="errorsBack.trailer"
                      @input="errorsBack.trailer = ''" :rules="characterLimitRules">
                    </AppTextField>
                  </div>
                </div>
              </VCol>

              <VCol cols="12" sm="6">
                <AppSelect :requiredField="true" clearable :items="vehicle_structures"
                  v-model="form.vehicle_structure_id" label="Estructura del vehículo"
                  :error-messages="errorsBack.vehicle_structure_id" @input="errorsBack.vehicle_structure_id = ''"
                  :rules="[requiredValidator]">
                </AppSelect>
              </VCol>

            </VRow>

          </VForm>
        </div>

        <div v-show="currentTab == 1">
          <VForm ref="refFormTypeDocument" @submit.prevent="() => { }" :disabled="disabledFiledsView">
            <VRow>
              <template v-for="(item, index) in form.type_documents" :key="index">
                <VCol cols="12" class="w-100 d-flex justify-end">
                  <VBtn icon v-if="shouldShowDeleteButton('type_documents') && !disabledFiledsView" size="30"
                    class="mt-7" color="error" @click="deleteDataArrayTypeDocument(index)">
                    <VIcon icon="tabler-trash"></VIcon>
                  </VBtn>
                </VCol>
                <VCol cols="12" sm="6">
                  <SelectTypeDocumentForm :key="'select_' + index" :rules="[requiredValidator]" :requiredField="true"
                    label="Tipo de documento" v-model="item.type_document_id"
                    @input="errorsBack.type_document_id = ''" />
                </VCol>
                <VCol cols="12" sm="6">
                  <AppTextField :requiredField="true" label="Número de documento" v-model="item.document_number"
                    :rules="[requiredValidator]">
                  </AppTextField>
                </VCol>
                <VCol cols="12" sm="6">
                  <AppDateTimePicker clearable :requiredField="true" label="Fecha de expedición"
                    :rules="[requiredValidator]" v-model="item.date_issue" :errorMessages="errorsBack.date_issue"
                    @input="errorsBack.date_issue = ''" @update:model-value="updateEndDate($event, item)" :config="{
                      dateFormat: 'Y-m-d',
                      disable: [
                        { from: `${currentYear}-${(currentMonth).toString().padStart(2, '0')}-${(currentDay + 1).toString().padStart(2, '0')}`, to: '9999-12-31' }
                      ]
                    }" />
                </VCol>
                <VCol cols="12" sm="6">
                  <AppDateTimePicker clearable :requiredField="true" label="Fecha de vencimiento"
                    v-model="item.expiration_date"
                    :error-messages="errorsBack[`type_documents[${index}].expiration_date`]"
                    @input="errorsBack[`type_documents[${index}].expiration_date`] = ''" :rules="[
                      requiredValidator,
                      value => expirationDateValidator(value, item.date_issue)
                    ]" />
                </VCol>

                <VCol cols="12" sm="6">
                  <AppFileInput label="Seleccione un archivo" :label2="item.photo ? '1 archivo agregado' : ''" clearable
                    :key="index" @change="changeFile($event, item)" :viewFile="true" @viewFile="viewFile(item.photo)">
                  </AppFileInput>
                </VCol>

                <VDivider />
              </template>

              <VCol v-if="!disabledFiledsView" cols="12" class="w-100 d-flex justify-center">
                <VBtn class="ml-3" @click="addDataArrayTypeDocument()">
                  <VIcon icon="tabler-plus"></VIcon>
                  Agregar documento
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </div>

        <div v-show="currentTab == 2">
          <VForm ref="refFormPhoto" @submit.prevent="() => { }" :disabled="disabledFiledsView">
            <VRow>
              <!-- Foto frontal -->
              <VCol cols="12" sm="6">
                <AppFileInput :requiredField="form.id ? false : true" clearable :loading="inputFilePhotoFront.loading"
                  label="Foto frontal" :label2="form.photo_front ? '1 archivo agregado' : ''"
                  @change="inputFilePhotoFront.handleImageSelected" :key="inputFilePhotoFront.key"
                  :error-messages="errorsBack.photo_front" @input="errorsBack.photo_front = ''"
                  :rules="[form.id ? true : requiredValidator, ...fileValidationRules]"></AppFileInput>

                <template v-if="inputFilePhotoFront.imageUrl || form.photo_front">
                  <div class="image-container mx-auto">
                    <VImg class="uniform-image" :src="inputFilePhotoFront.imageUrl ?? storageBack(form.photo_front)"
                      alt="Foto frontal" cover></VImg>
                  </div>
                </template>
              </VCol>

              <!-- Foto reverso -->
              <VCol cols="12" sm="6">
                <AppFileInput :requiredField="form.id ? false : true" clearable :loading="inputFilePhotoRear.loading"
                  label="Foto reverso" :label2="form.photo_rear ? '1 archivo agregado' : ''"
                  @change="inputFilePhotoRear.handleImageSelected" :key="inputFilePhotoRear.key"
                  :error-messages="errorsBack.photo_rear" @input="errorsBack.photo_rear = ''"
                  :rules="[form.id ? true : requiredValidator, ...fileValidationRules]"></AppFileInput>

                <template v-if="inputFilePhotoRear.imageUrl || form.photo_rear">
                  <div class="image-container mx-auto">
                    <VImg class="uniform-image" :src="inputFilePhotoRear.imageUrl ?? storageBack(form.photo_rear)"
                      alt="Foto reverso" cover></VImg>
                  </div>
                </template>
              </VCol>

              <!-- Foto lado derecho -->
              <VCol cols="12" sm="6">
                <AppFileInput :requiredField="form.id ? false : true" clearable
                  :loading="inputFilePhotoRightSide.loading" label="Foto lado derecho"
                  :label2="form.photo_right_side ? '1 archivo agregado' : ''"
                  @change="inputFilePhotoRightSide.handleImageSelected" :key="inputFilePhotoRightSide.key"
                  :error-messages="errorsBack.photo_right_side" @input="errorsBack.photo_right_side = ''"
                  :rules="[form.id ? true : requiredValidator, ...fileValidationRules]"></AppFileInput>

                <template v-if="inputFilePhotoRightSide.imageUrl || form.photo_right_side">
                  <div class="image-container mx-auto">
                    <VImg class="uniform-image"
                      :src="inputFilePhotoRightSide.imageUrl ?? storageBack(form.photo_right_side)" alt="Lado derecho"
                      cover></VImg>
                  </div>
                </template>
              </VCol>

              <!-- Foto lado izquierdo -->
              <VCol cols="12" sm="6">
                <AppFileInput :requiredField="form.id ? false : true" clearable
                  :loading="inputFilePhotoLeftSide.loading" label="Foto lado izquierdo"
                  :label2="form.photo_left_side ? '1 archivo agregado' : ''"
                  @change="inputFilePhotoLeftSide.handleImageSelected" :key="inputFilePhotoLeftSide.key"
                  :error-messages="errorsBack.photo_left_side" @input="errorsBack.photo_left_side = ''"
                  :rules="[form.id ? true : requiredValidator, ...fileValidationRules]"></AppFileInput>

                <template v-if="inputFilePhotoLeftSide.imageUrl || form.photo_left_side">
                  <div class="image-container mx-auto">
                    <VImg class="uniform-image"
                      :src="inputFilePhotoLeftSide.imageUrl ?? storageBack(form.photo_left_side)" alt="Lado izquierdo"
                      cover></VImg>
                  </div>
                </template>
              </VCol>
            </VRow>
          </VForm>
        </div>

        <div v-show="currentTab == 3">
          <VForm ref="refFormEmergencyElement" @submit.prevent="() => { }" :disabled="disabledFiledsView">
            <VRow>
              <template v-for="(item, index) in form.emergency_elements" :key="index">
                <VCol cols="12" class="w-100 d-flex justify-end">
                  <VBtn icon v-if="shouldShowDeleteButton('emergency_elements') && !disabledFiledsView" size="30"
                    class="mt-7" color="error" @click="deleteDataArrayEmergencyElement(index)">
                    <VIcon icon="tabler-trash"></VIcon>
                  </VBtn>
                </VCol>
                <VCol cols="12" sm="4">
                  <SelectEmergencyElementForm :key="'select2_' + index" name="Select2" :rules="[requiredValidator]"
                    :requiredField="true" label="Elemento de emergencia" v-model="item.emergency_element_id"
                    :error-messages="errorsBack.emergency_element_id" @input="errorsBack.emergency_element_id = ''" />
                </VCol>
                <VCol cols="12" sm="4">
                  <AppTextField :requiredField="true" label="Cantidad" v-model="item.quantity"
                    @keypress="onlyNumbersPositivesKeyPress" :rules="[requiredValidator]"
                    :error-messages="errorsBack.quantity" @input="errorsBack.quantity = ''">
                  </AppTextField>
                </VCol>

                <VCol cols="12" sm="4">
                  <AppDateTimePicker clearable label="Fecha de vencimiento" v-model="item.expiration_date"
                    :errorMessages="errorsBack.expiration_date" @input="errorsBack.expiration_date = ''"
                    :config="{ dateFormat: 'Y-m-d', disable: [{ from: `2020-01-01`, to: `${currentYear}-${currentMonth}-${currentDay}` }] }" />
                </VCol>

                <VDivider />
              </template>

              <VCol v-if="!disabledFiledsView" cols="12" class="w-100 d-flex justify-center">
                <VBtn class="ml-3" @click="addDataArrayEmergencyElement()">
                  <VIcon icon="tabler-plus"></VIcon>
                  Agregar elemento de emergencia
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </div>

        <div v-show="currentTab == 4">
          <VSkeletonLoader type="card, list-item-avatar-three-line, list-item-three-line">
            <VRow>
              <template v-for="(inspection, key) in typeInspectionInputs" :key="key">
                <VCol cols="12">
                  <VCard class="mb-4">
                    <VCardTitle class="text-h6 pa-4">
                      Inspección {{ inspection.name }}
                    </VCardTitle>

                    <VRow dense class="px-4 pb-4">
                      <!-- Columna Todos -->
                      <VCol cols="12" md="4" v-if="inspection.inputs.length > 0">
                        <div class="d-flex align-center">
                          <VSwitch label="Todos" class="ma-0" :model-value="todosSeleccionados(inspection)"
                            @change="toggleTodos(inspection, $event)" />
                        </div>
                      </VCol>

                      <!-- Columnas de switches -->
                      <template v-for="(input, index) in inspection.inputs" :key="index">
                        <VCol cols="12" md="4">
                          <VRow dense class="d-flex align-center">
                            <VCol cols="auto">
                              <VSwitch :disabled="input.id === 1" :label="input.description" :value="input.id"
                                v-model="typeGroups" />
                            </VCol>
                          </VRow>
                        </VCol>
                      </template>
                    </VRow>
                  </VCard>
                </VCol>
              </template>
            </VRow>
          </VSkeletonLoader>
        </div>
      </VCardText>

      <VCardText class="d-flex justify-end gap-3 flex-wrap mt-5">
        <BtnBack :disabled="isLoading" :loading="isLoading" />
        <BtnSave v-if="!disabledFiledsView" :disabled="isLoading" :loading="isLoading" @execute="submitForm" />
      </VCardText>
    </VCard>
  </div>
</template>


<style lang="scss" scoped>
/* Contenedor principal para todas las imágenes */
.image-container {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  background: #2f1b44;
  block-size: 300px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 10%);
  inline-size: 100%;
  margin-block-start: 1rem;
  max-inline-size: 500px;

  /* Color de fondo mientras carga */
}

/* Estilo para las imágenes */
.uniform-image {
  block-size: 100%;
  inline-size: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.3s ease;
}

/* Efecto hover opcional */
.uniform-image:hover {
  transform: scale(1.03);
}

/* Responsive para móviles */
@media (max-width: 600px) {
  .image-container {
    block-size: 250px;
    max-inline-size: 100%;
  }
}
</style>
