<script lang="ts" setup>
import AppTextarea from '@/@core/components/app-form-elements/AppTextarea.vue';
import { useToast } from '@/composables/useToast';
import IErrorsBack from "@/interfaces/Axios/IErrorsBack";
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

const form = ref({})

const clearForm = () => {
  for (const key in form.value) {
    form.value[key] = null
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
    //formulario 

    tabs.value = data.value.tabs;
    states.value = data.value.states
    responseDocument.value = data.value.responseDocument
    responseVehicle.value = data.value.responseVehicle

    tabs.value.forEach(element => {

      refFormValidate[element.id + '_validate'] = ref<VForm>()

      if (element.inspection_type_inputs) {
        element.inspection_type_inputs.forEach(elementSelect => {
          form.value[`${elementSelect.id}`] = '';
        });
      }
    });
    if (data.value.form) {
      cloneForm.value = JSON.parse(JSON.stringify(data.value.form));
      form.value = data.value.form

      changeState(cloneForm.value.state_id)
      form.value.city_id = cloneForm.value.city_id
    }
  }
}

const updateValidationToFalse = () => {
  tabs.value.forEach(tab => {
    tab.errorsValidations = false;
  });
}

const exito = ref<Array<boolean>>([])

const allValidations = async () => {
  updateValidationToFalse()
  exito.value = []

  tabs.value.forEach(async (element, key) => {
    const validation = await refFormValidate[element.id + '_validate'].value[0]?.validate()

    if (validation) {
      exito.value.push(validation?.valid)
      tabs.value[key].errorsValidations = !validation?.valid
    }
  });

  const exitoFinal = exito.value.every(item => item === true);

  return exitoFinal;
}

const submitForm = async (isCreateAndNew: boolean = false) => {

  const validation = await allValidations()

  if (validation) {
    loading.form = true;
    const url = form.value.id ? `/inspection/update/${form.value.id}` : `/inspection/store`

    form.value.company_id = company.value.id
    form.value.inspection_type_id = route.params.inspection_type_id
    form.value.type_documents = vehicleData.type_documents


    const { data, response } = await useApi(url).post(form.value);

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
  // clearForm()
  // await fetchDataTabs()
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

const operatorData = reactive({
  document: null as null | string,
  license: null as null | string,
});

const changeOperator = (event: Event) => {
  if (event) {
    operatorData.document = event.document
    operatorData.license = event.license
  }
}

const vehicleData = reactive({
  license_plate: null as null | string,
  brand_vehicle_name: null as null | string,
  model: null as null | string,
  vehicle_structure_name: null as null | string,
  type_documents: [] as Array<{
    type_document_name: string,
    document_number: string,
    expiration_date: string,
  }>,
});

const changeVehicle = async (event: Event) => {
  if (event) {

    const url = `/inspection/getVehicleInfo/${event.value}`

    const { response, data } = await useApi(url).get();

    if (response.value?.ok && data.value) {
      vehicleData.license_plate = data.value.vehicle.license_plate
      vehicleData.brand_vehicle_name = data.value.vehicle.brand_vehicle_name
      vehicleData.model = data.value.vehicle.model
      vehicleData.vehicle_structure_name = data.value.vehicle.vehicle_structure_name
      vehicleData.type_documents = data.value.vehicle.type_documents

      cloneForm.value.type_documents.forEach(element => {
        const search = vehicleData.type_documents.find(ele => ele.id === element.vehicle_document_id);
        search.response = element.original
        loading.form = false
      });
    }
  }
}
</script>

<template>
  <div>
    <VCard :loading="loading.form" :disabled="loading.form">
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
                  :requiredField="true" clearable :items="cities" label="Ciudad" :error-messages="errorsBack.city_id"
                  @input="errorsBack.city_id = ''" :rules="[requiredValidator]" v-model="form.city_id">
                </AppAutocomplete>
              </VCol>
              <VCol cols="12">
                <AppCardActions title="Información del conductor" action-collapsed>
                  <VCardText>
                    <VRow>
                      <VCol cols="12" sm="6">
                        <SelectUserOperatorForm :requiredField="true" clearable label="Operador"
                          :error-messages="errorsBack.user_id" @input="errorsBack.user_id = ''"
                          :rules="[requiredValidator]" @update:model-value="changeOperator($event)"
                          v-model="form.user_id">
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
                <AppCardActions title="Información del Vehiculo" action-collapsed>
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
                          v-model="item.response">
                        </AppSelect>
                      </VCol>
                    </VRow>
                  </VCardText>
                </AppCardActions>
              </VCol>

            </VRow>

            <VRow v-else>
              <VCol cols="12" sm="6" v-for="(itemSelect) in item.inspection_type_inputs" :key="itemSelect.order">
                <AppSelect :requiredField="true" clearable :items="responseVehicle" v-model="form[itemSelect.id]"
                  :label="itemSelect.name" :error-messages="errorsBack[itemSelect.id]"
                  @input="errorsBack[itemSelect.id] = ''">
                </AppSelect>
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
        <BtnSave v-if="!disabledFiledsView" :disabled="isLoading" :loading="isLoading" @execute="submitForm" />
      </VCardText>
    </VCard>
  </div>
</template>
