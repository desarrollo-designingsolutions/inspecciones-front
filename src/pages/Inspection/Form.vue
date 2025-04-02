<script lang="ts" setup>
import AppTextarea from '@/@core/components/app-form-elements/AppTextarea.vue';
import { useToast } from '@/composables/useToast';
import IErrorsBack from "@/interfaces/Axios/IErrorsBack";
import { router } from '@/plugins/1.router';
import { useAuthenticationStore } from "@/stores/useAuthenticationStore";
import type { VForm } from 'vuetify/components/VForm';

definePage({
  path: "Inspection-form/:inspection_type_id/:action/:id?",
  name: "Inspection-Form",
  meta: {
    redirectIfLoggedIn: true,
    requiresAuth: true,
    requiredPermission: "inspection.list",
  },
});

interface IOperatorData {
  document: string | null,
  license: string | null,
}
interface IForm {
  id: string | null,
  company_id: string | null,
  inspection_type_id: string | null,
  vehicle_id: string | null,
  inspection_date: string | null,
  state_id: string | null,
  city_id: string | null,
  user_inspector_id: number | string | null,
  user_operator_id: string | null,
  general_comment: string | null,
  type_documents: Array<object>,
}
interface IVehicleData {
  license_plate: string | null,
  brand_vehicle_name: string | null,
  model: string | null,
  vehicle_structure_name: string | null,
  type_documents: Array<{
    type_document_name: string,
    document_number: string,
    expiration_date: string,
    original: string,
  }>,
}

const authenticationStore = useAuthenticationStore();
const { company } = storeToRefs(authenticationStore)
const { toast } = useToast()
const errorsBack = ref<IErrorsBack>({});
const disabledFiledsView = ref<boolean>(false);
const route = useRoute()
const refFormValidate = ref<IForm>();
const loading = reactive({
  form: false,
  cities: false,
})

const form = ref<IForm>({
  id: null,
  company_id: null,
  inspection_type_id: null,
  vehicle_id: null,
  inspection_date: null,
  state_id: null,
  city_id: null,
  user_inspector_id: null,
  user_operator_id: null,
  general_comment: null,
  type_documents: []
})

const clearForm = () => {
  isCreateAndNew.value = false
  for (const key in form.value) {
    form.value[key] = null
  }
  form.value.type_documents = []

  operatorData.value = {
    document: null,
    license: null,
  }
  vehicleData.value = {
    license_plate: null,
    brand_vehicle_name: null,
    model: null,
    vehicle_structure_name: null,
    type_documents: [],
  }
}
const cloneForm = ref();

const fetchDataForm = async () => {

  form.value.id = route.params.id || null

  const url = form.value.id ? `/inspection/${route.params.id}/edit` : `/inspection/create/${route.params.inspection_type_id}`

  loading.form = true
  const { data, response } = await useAxios(url).get({
    company_id: company.value.id
  });

  if (response.status == 200 && data) {

    tabs.value = data.tabs;
    states.value = data.states
    responseDocument.value = data.responseDocument
    responseVehicle.value = data.responseVehicle

    tabs.value.forEach(element => {

      refFormValidate[element.id + '_validate'] = ref<VForm>()

      if (element.inspection_type_inputs) {
        element.inspection_type_inputs.forEach(elementSelect => {
          form.value[`${elementSelect.id}`] = {
            value: '',         // Aquí se guardará el valor del AppSelect
            observation: ''    // Aquí se guardará la observación del AppTextarea
          };
        });
      }
    });

    //formulario 
    if (data.form) {
      cloneForm.value = JSON.parse(JSON.stringify(data.form));
      form.value = data.form

      changeState(cloneForm.value.state_id)
      form.value.city_id = cloneForm.value.city_id
    }
  }
  loading.form = false

}

const updateValidationToFalse = () => {
  tabs.value.forEach(tab => {
    tab.errorsValidations = false;
  });
}

const allValidations = async () => {
  updateValidationToFalse();
  let exito: any[] = [];

  const validationPromises = processedTabs.value.map(async (element, key) => {
    const validation = await refFormValidate[element.id + '_validate'].value[0]?.validate();

    console.log(element.id + '_validate', validation);

    if (validation) {
      exito.push(validation.valid);
      tabs.value[key].errorsValidations = !validation.valid;
    }
  });

  await Promise.all(validationPromises);

  const exitoFinal = exito.every(item => item === true);

  return exitoFinal;
};

const isCreateAndNew = ref<boolean>(false)
const submitForm = async () => {

  const validation = await allValidations()

  if (validation) {
    form.value.id = route.params.id || null
    loading.form = true;
    const url = form.value.id ? `/inspection/update/${form.value.id}` : `/inspection/store`

    form.value.company_id = company.value.id
    form.value.user_inspector_id = authenticationStore.user.id
    form.value.inspection_type_id = route.params.inspection_type_id
    form.value.type_documents = vehicleData.value.type_documents


    const { data, response } = await useAxios(url).post(form.value);

    if (response.status == 200 && data) {
      if (data.code == 200) {
        if (isCreateAndNew.value) {
          clearForm(); // Limpiar el formulario si es "Crear y crear otro"
        } else {
          router.push({ name: 'Inspection-List' }); // Redirigir si es "Crear"
        }
      }
    }
    if (data.code === 422) errorsBack.value = data.errors ?? {};

    loading.form = false;
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
const tabs = ref([])

const responseDocument = ref<Array<{ value: string, title: string }>>([])
const responseVehicle = ref<Array<{ value: string, title: string }>>([])

// STATES AND CITIES
const states = ref<Array<{ value: string, title: string }>>([])
const cities = ref<Array<{ value: string, title: string }>>([])

const changeState = async (event: Event) => {
  form.value.city_id = null;

  loading.cities = true;
  const { data, response } = await useAxios(`/selectCities/${event}`).get();
  loading.cities = false;

  if (response.status == 200 && data) {
    cities.value = data.cities;
  }
}


const operatorData = ref<IOperatorData>({
  document: null,
  license: null,
});

const changeOperator = (event: Event) => {
  if (event) {
    operatorData.value.document = event.document
    operatorData.value.license = event.license
  }
}

const vehicleData = ref<IVehicleData>({
  license_plate: null,
  brand_vehicle_name: null,
  model: null,
  vehicle_structure_name: null,
  type_documents: [],
});

const isFirstVehicleChange = ref(true)

const pendingVehicleEvent = ref(null)

const previousVehicleData = ref<IVehicleData | null>(null);

const processVehicleChange = async (event: any) => {
  loading.form = true;

  form.value.id = route.params.id || null

  const url = `/inspection/getVehicleInfo/${event.value}`;
  const { response, data } = await useAxios(url).get({
    params: { inspection_type_id: route.params.inspection_type_id, inspection_id: form.value.id }
  });
  if (response.status === 200 && data) {
    vehicleData.value.license_plate = data.vehicle.license_plate;
    vehicleData.value.brand_vehicle_name = data.vehicle.brand_vehicle_name;
    vehicleData.value.model = data.vehicle.model;
    vehicleData.value.vehicle_structure_name = data.vehicle.vehicle_structure_name;
    vehicleData.value.type_documents = data.vehicle.type_documents;

    if (data.form) {
      form.value = JSON.parse(JSON.stringify(data.form));
    }


    tabs.value = [
      tabs.value[0], // Mantener primer tab
      ...data.tabs.map(tab => ({ ...tab, show: true }))
    ];
  }
  loading.form = false;
};

const changeVehicle = async (event: any) => {
  if (!event) return;

  previousVehicleData.value = JSON.parse(JSON.stringify(form.value.vehicle_id));

  if (isFirstVehicleChange.value) {
    await processVehicleChange(event);
    isFirstVehicleChange.value = false;
  } else {
    pendingVehicleEvent.value = event;
    openModalQuestionChangeVehicleSave();
  }
};

const confirmVehicleChange = async () => {
  if (pendingVehicleEvent.value) {
    await clearForm()
    form.value.vehicle_id = pendingVehicleEvent.value
    await processVehicleChange(pendingVehicleEvent.value);
    pendingVehicleEvent.value = null;
  }
};

const cancelVehicleChange = () => {
  // Si se cancela, revertir la información del vehículo a la anterior
  if (previousVehicleData.value) {
    form.value.vehicle_id = previousVehicleData.value;
  }
  // Limpiar el evento pendiente
  pendingVehicleEvent.value = null;
};

const processedTabs = computed(() => {
  // Inicializar campos del formulario para los inputs de los tabs
  tabs.value.forEach(tab => {
    if (tab.inspection_type_inputs) {
      tab.inspection_type_inputs.forEach(input => {
        if (!form.value[input.id]) {
          form.value[input.id] = { value: '', observation: '' }; // Estructura inicial
        }
      });
    }
  });

  return tabs.value.filter(tab => tab.show); // Filtra solo tabs visibles
});


//ModalQuestion
const refModalQuestion = ref()

const openModalQuestionSave = async (typeCreate: boolean) => {
  // const validation = await allValidations()
  // if (validation) {
  isCreateAndNew.value = typeCreate
  refModalQuestion.value.openModal()
  refModalQuestion.value.componentData.title = "Está seguro que usted revisó todos los ítems"
  // }
  // else {
  //   toast('Faltan Campos Por Diligenciar', '', 'danger')
  // }
}

//ModalQuestionChangeVehicle
const refModalQuestionChangeVehicle = ref()

const openModalQuestionChangeVehicleSave = async () => {
  refModalQuestionChangeVehicle.value.openModal()
  refModalQuestionChangeVehicle.value.componentData.title = "Si cambia de vehiculo perdera la informacion ya ingresada"
}

watch(
  processedTabs,
  (newTabs) => {
    // Primero definimos cuáles deberían ser las claves actuales basadas en los tabs
    const validKeys = newTabs.map((tab) => tab.id + '_validate');

    // Eliminar del objeto las claves que ya no están en los nuevos tabs
    Object.keys(refFormValidate).forEach((key) => {
      if (!validKeys.includes(key)) {
        delete refFormValidate[key];
      }
    });

    // Agregar nuevas claves si no existen
    newTabs.forEach((tab) => {
      const key = tab.id + '_validate';
      if (!(key in refFormValidate)) {
        // Se crea el ref para el formulario del tab
        refFormValidate[key] = ref<VForm>();
      }
    });
  },
  { immediate: true, deep: true }
);

</script>

<template>
  <div>
    <VCard :loading="loading.form" :disabled="loading.form">
      <VCardTitle class="d-flex justify-space-between">
        <span v-if="route.params.inspection_type_id == 1">
          Inspección Pre-Operacional
        </span>
        <span v-else>
          Inspección HSEQ
        </span>
      </VCardTitle>
      <VCardText v-if="!loading.form">
        <VTabs v-model="currentTab">
          <VTab class="text-none" v-for="(item, index) in processedTabs" :key="index" v-show="item.show">
            <VIcon start :icon="!item.errorsValidations ? '' : 'tabler-alert-circle-filled'"
              :color="!item.errorsValidations ? '' : 'error'" />
            {{ item.name }}
          </VTab>
        </VTabs>
      </VCardText>

      <VCardText>

        <div v-show="currentTab == item.order" v-for="(item, index) in processedTabs" :key="index">
          <VForm :ref="refFormValidate[item.id + '_validate']" @submit.prevent="() => { }"
            :disabled="disabledFiledsView">
            <VRow v-if="index === 0">
              <VCol cols="12" sm="6">

                <SelectPlateVehicleForm :requiredField="true" clearable label="Placa del vehículo"
                  :error-messages="errorsBack.vehicle_id" @input="errorsBack.vehicle_id = ''"
                  :rules="[requiredValidator]" @update:model-value="changeVehicle($event)" v-model="form.vehicle_id">
                </SelectPlateVehicleForm>
              </VCol>

              <VCol cols="12" md="6">
                <AppDateTimePicker :rules="[requiredValidator]" :requiredField="true" clearable
                  :error-messages="errorsBack.inspection_date" @input="errorsBack.inspection_date = ''"
                  label="Fecha de inspección" :config="{ dateFormat: 'Y-m-d' }" v-model="form.inspection_date" />
              </VCol>

              <VCol cols="12" sm="6">
                <AppAutocomplete :requiredField="true" clearable :items="states" label="Departamento de operación"
                  @update:model-value="changeState($event)" :error-messages="errorsBack.state_id"
                  @input="errorsBack.state_id = ''" :rules="[requiredValidator]" v-model="form.state_id">
                </AppAutocomplete>
              </VCol>

              <VCol cols="12" sm="6">
                <AppAutocomplete :disabled="cities.length == 0 || disabledFiledsView" :loading="loading.cities"
                  :requiredField="cities.length > 0" clearable :items="cities" label="Ciudad de operación"
                  :error-messages="errorsBack.city_id" @input="errorsBack.city_id = ''"
                  :rules="[cities.length > 0 ? requiredValidator : null]" v-model="form.city_id">
                </AppAutocomplete>
              </VCol>
              <VCol cols="12">
                <AppCardActions title="Información del conductor" action-collapsed>
                  <VCardText>
                    <VRow>
                      <VCol cols="12" sm="6">
                        <SelectUserOperatorForm :requiredField="true" clearable label="Operador"
                          :error-messages="errorsBack.user_operator_id" @input="errorsBack.user_operator_id = ''"
                          :rules="[requiredValidator]" @update:model-value="changeOperator($event)"
                          v-model="form.user_operator_id">
                        </SelectUserOperatorForm>
                      </VCol>
                      <VCol cols="12" sm="6">
                        <AppTextField disabled label="Documento" :value="operatorData.document">
                        </AppTextField>
                      </VCol>
                      <VCol cols="12" sm="6">
                        <AppTextField disabled label="Licencia" :value="operatorData.license">
                        </AppTextField>
                      </VCol>
                    </VRow>
                  </VCardText>
                </AppCardActions>
              </VCol>

              <VCol cols="12">
                <AppCardActions title="Información del Vehículo" action-collapsed>
                  <VCardText>
                    <VRow>
                      <VCol cols="12" sm="6">
                        <AppTextField disabled label="Placa" :value="vehicleData.license_plate">
                        </AppTextField>
                      </VCol>
                      <VCol cols="12" sm="6">
                        <AppTextField disabled label="Marca" :value="vehicleData.brand_vehicle_name">
                        </AppTextField>
                      </VCol>
                      <VCol cols="12" sm="6">
                        <AppTextField disabled label="Modelo" :value="vehicleData.model">
                        </AppTextField>
                      </VCol>
                      <VCol cols="12" sm="6">
                        <AppTextField disabled label="Estructura del vehículo"
                          :value="vehicleData.vehicle_structure_name">
                        </AppTextField>
                      </VCol>
                    </VRow>
                  </VCardText>
                </AppCardActions>
              </VCol>

              <VCol cols="12">
                <AppCardActions title="Documentos" noActions
                  subtitle="Verifique si los documentos del vehículo presentados son originales o copia.">
                  <VCardText>
                    <VRow v-for="(item, index) in vehicleData.type_documents" :key="index">
                      <VCol cols="12" sm="4">
                        <AppTextField disabled :label="item.type_document_name" :value="item.document_number">
                        </AppTextField>
                      </VCol>
                      <VCol cols="12" sm="4">
                        <AppTextField disabled :iconLabel="{
                          icon: 'tabler-circle-filled',
                          color: item.traffic_light_color,
                        }" label="Fecha de vencimiento" :value="item.expiration_date">
                        </AppTextField>
                      </VCol>
                      <VCol cols="12" sm="4">
                        <AppSelect label="¿Es original?" :requiredField="true" :items="responseDocument"
                          v-model="item.original" :rules="[requiredValidator]">
                        </AppSelect>
                      </VCol>
                    </VRow>
                  </VCardText>
                </AppCardActions>
              </VCol>

            </VRow>

            <VRow v-else>
              <VCol cols="12" sm="6" v-for="(itemSelect) in item.inspection_type_inputs" :key="itemSelect.order">
                <AppSelect :name="'select_' + itemSelect.id" :requiredField="true" clearable :items="responseVehicle"
                  v-model="form[itemSelect.id].value" :label="itemSelect.name"
                  :error-messages="errorsBack[itemSelect.id]" @input="errorsBack[itemSelect.id] = ''"
                  :rules="[requiredValidator]">
                </AppSelect>
                <AppTextarea :name="'textArea_' + itemSelect.id" v-if="route.params.inspection_type_id != 1"
                  label="Observacion" v-model="form[itemSelect.id].observation">
                </AppTextarea>
              </VCol>

              <VCol v-if="index === tabs.length - 1" cols="12">
                <AppCardActions noActions subtitle="Registre aqui las observaciones generales de la inspección.">
                  <VCardText>
                    <AppTextarea label="Observaciones generales" v-model="form.general_comment"></AppTextarea>
                  </VCardText>
                </AppCardActions>
              </VCol>
            </VRow>
          </VForm>
        </div>

      </VCardText>

      <VCardText class="d-flex justify-end gap-3 flex-wrap mt-5">
        <BtnBack :disabled="isLoading" :loading="isLoading" />
        <BtnSave v-if="!disabledFiledsView" :disabled="isLoading" :loading="isLoading"
          @execute="openModalQuestionSave" />
      </VCardText>
    </VCard>

    <ModalQuestion ref="refModalQuestion" @success="submitForm" />

    <ModalQuestion ref="refModalQuestionChangeVehicle" @success="confirmVehicleChange" @cancel="cancelVehicleChange" />

  </div>
</template>
