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
  }>,
}

const authenticationStore = useAuthenticationStore();
const { company } = storeToRefs(authenticationStore)
const { toast } = useToast()
const errorsBack = ref<IErrorsBack>({});
const disabledFiledsView = ref<boolean>(false);
const route = useRoute()
const refFormValidate = {}
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
  const { data, response } = await useApi<any>(
    createUrl(url, {
      query: {
        company_id: company.value.id
      },
    })
  );

  if (response.value?.ok && data.value) {

    tabs.value = data.value.tabs;
    states.value = data.value.states
    responseDocument.value = data.value.responseDocument
    responseVehicle.value = data.value.responseVehicle

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
    if (data.value.form) {
      cloneForm.value = JSON.parse(JSON.stringify(data.value.form));
      form.value = data.value.form

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

  const validationPromises = tabs.value.map(async (element, key) => {
    const validation = await refFormValidate[element.id + '_validate'].value[0]?.validate();

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
    loading.form = true;
    const url = form.value.id ? `/inspection/update/${form.value.id}` : `/inspection/store`

    form.value.company_id = company.value.id
    form.value.user_inspector_id = authenticationStore.user.id
    form.value.inspection_type_id = route.params.inspection_type_id
    form.value.type_documents = vehicleData.value.type_documents


    const { data, response } = await useApi(url).post(form.value);

    if (response.value?.ok && data.value) {
      if (data.value.code == 200) {
        if (isCreateAndNew.value) {
          clearForm(); // Limpiar el formulario si es "Crear y crear otro"
        } else {
          router.push({ name: 'Inspection-List' }); // Redirigir si es "Crear"
        }
      }
    }
    if (data.value.code === 422) errorsBack.value = data.value.errors ?? {};

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
  const { data, response } = await useApi(`/selectCities/${event}`).get();
  loading.cities = false;

  if (response.value?.ok && data.value) {
    cities.value = data.value.cities;
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

const changeVehicle = async (event: Event) => {
  if (event) {

    const url = `/inspection/getVehicleInfo/${event.value}`

    const { response, data } = await useApi(url).get();

    if (response.value?.ok && data.value) {
      vehicleData.value.license_plate = data.value.vehicle.license_plate
      vehicleData.value.brand_vehicle_name = data.value.vehicle.brand_vehicle_name
      vehicleData.value.model = data.value.vehicle.model
      vehicleData.value.vehicle_structure_name = data.value.vehicle.vehicle_structure_name
      vehicleData.value.type_documents = data.value.vehicle.type_documents

      cloneForm.value.type_documents.forEach(element => {
        const search = vehicleData.value.type_documents.find(ele => ele.id === element.vehicle_document_id);
        search.response = element.original
        loading.form = false
      });
    }
  }
}


//ModalQuestion
const refModalQuestion = ref()

const openModalQuestionSave = async (typeCreate: boolean) => {
  const validation = await allValidations()
  if (validation) {
    isCreateAndNew.value = typeCreate
    refModalQuestion.value.openModal()
    refModalQuestion.value.componentData.title = "Está seguro que usted revisó todos los ítems"
  }
  else {
    toast('Faltan Campos Por Diligenciar', '', 'danger')
  }
}

</script>

<template>
  <div>
    <VCard :loading="loading.form" :disabled="loading.form">
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
            {{ item.name }}
          </VTab>
        </VTabs>
      </VCardText>

      <VCardText>

        <div v-show="currentTab == item.order" v-for="(item, index) in tabs" :key="index">
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
                  :requiredField="cities.length > 0" clearable :items="cities" label="Ciudad"
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
                        <AppTextField disabled label="Fecha de vencimiento" :value="item.expiration_date">
                        </AppTextField>
                      </VCol>
                      <VCol cols="12" sm="4">
                        <AppSelect label="¿Es original?" :requiredField="true" :items="responseDocument"
                          v-model="item.response" :rules="[requiredValidator]">
                        </AppSelect>
                      </VCol>
                    </VRow>
                  </VCardText>
                </AppCardActions>
              </VCol>

            </VRow>

            <VRow v-else>
              <VCol cols="12" sm="6" v-for="(itemSelect) in item.inspection_type_inputs" :key="itemSelect.order">
                <AppSelect :requiredField="true" clearable :items="responseVehicle" v-model="form[itemSelect.id].value"
                  :label="itemSelect.name" :error-messages="errorsBack[itemSelect.id]"
                  @input="errorsBack[itemSelect.id] = ''">
                </AppSelect>
                <AppTextarea v-if="route.params.inspection_type_id != 1" label="Observacion"
                  v-model="form[itemSelect.id].observation">
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

  </div>
</template>
