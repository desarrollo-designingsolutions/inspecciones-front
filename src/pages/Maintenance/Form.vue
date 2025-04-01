<script lang="ts" setup>
import AppTextarea from '@/@core/components/app-form-elements/AppTextarea.vue';
import { useToast } from '@/composables/useToast';
import IErrorsBack from "@/interfaces/Axios/IErrorsBack";
import { router } from '@/plugins/1.router';
import { useAuthenticationStore } from "@/stores/useAuthenticationStore";
import type { VForm } from 'vuetify/components/VForm';

definePage({
  path: "Maintenance-form/:maintenance_type_id/:action/:id?",
  name: "Maintenance-Form",
  meta: {
    redirectIfLoggedIn: true,
    requiresAuth: true,
    requiredPermission: "maintenance.list",
  },
});

interface IForm {
  id: null | string,
  company_id: null | string,
  maintenance_type_id: null | string,
  vehicle_id: null | string,
  maintenance_date: null | string,
  state_id: null | string,
  city_id: null | string,
  mileage: null | string,
  user_mechanic_id: null | string,
  user_made_maintenance_id: null | string | number,
  user_inspector_id: null | string | number,
  user_operator_id: null | string,
  status: null | string,
  general_comment: null | string,
}

interface IOperatorData {
  document: string | null,
  license: string | null,
}

interface IVehicleData {
  license_plate: string | null,
  brand_vehicle_name: string | null,
  model: string | null,
  vehicle_structure_name: string | null,
}

const authenticationStore = useAuthenticationStore();
const { company, user } = storeToRefs(authenticationStore);
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
  maintenance_type_id: null,
  vehicle_id: null,
  maintenance_date: null,
  state_id: null,
  city_id: null,
  mileage: null,
  user_mechanic_id: null,
  user_made_maintenance_id: null,
  user_inspector_id: null,
  user_operator_id: null,
  status: null,
  general_comment: null,
})

const clearForm = () => {

  form.value.id = null,
    form.value.company_id = null,
    form.value.maintenance_type_id = null,
    form.value.vehicle_id = null,
    form.value.maintenance_date = null,
    form.value.state_id = null,
    form.value.city_id = null,
    form.value.mileage = null,
    form.value.user_mechanic_id = null,
    form.value.user_made_maintenance_id = null,
    form.value.user_operator_id = null,
    form.value.status = null,
    form.value.general_comment = null,


    operatorData.value = {
      document: null,
      license: null,
    }
  vehicleData.value = {
    license_plate: null,
    brand_vehicle_name: null,
    model: null,
    vehicle_structure_name: null,
  }

  tabs.value.forEach(element => {
    if (!isNullOrUndefined(element.maintenance_type_inputs)) {
      element.maintenance_type_inputs.forEach(ele => {
        form.value[ele.id].type = null
        form.value[ele.id].type_maintenance = null
        form.value[ele.id].comment = null
      });
    }
  });
}
const cloneForm = ref();

const fetchDataForm = async () => {

  form.value.id = route.params.id || null

  const url = form.value.id ? `/maintenance/${route.params.id}/edit` : `/maintenance/create/${route.params.maintenance_type_id}`

  loading.form = true
  const { data, response } = await useAxios(url).get({
    company_id: company.value.id
  });

  if (response.status == 200 && data) {

    if (hasPermission('maintenance.make.form') && !hasPermission('maintenance.create.form')) {
      // Si tiene permiso, excluimos el tab en posición 0
      tabs.value = data.tabs.filter((_, index) => index !== 0);
    }
    else if (hasPermission('maintenance.create.form') && !hasPermission('maintenance.make.form')) {
      // Si no tiene permiso, solo incluimos el tab en posición 0
      tabs.value = data.tabs.filter((_, index) => index === 0);
    } else {
      tabs.value = data.tabs
    }

    console.log(tabs.value)

    states.value = data.states
    responseDocument.value = data.responseDocument
    responseStatus.value = data.responseStatus
    responseMaintenanceInput.value = data.responseMaintenanceInput
    responseTypeMaintenance.value = data.responseTypeMaintenance

    tabs.value.forEach(element => {

      refFormValidate[element.id + '_validate'] = ref<VForm>()

      if (element.maintenance_type_inputs) {
        element.maintenance_type_inputs.forEach(elementSelect => {
          form.value[`${elementSelect.id}`] = {
            type: '',
            type_maintenance: '',
            comment: '',
          };
        });
      }
    });

    //formulario 

    console.log(data)

    if (data.form) {

      console.log('entra al data.form')
      cloneForm.value = JSON.parse(JSON.stringify(data.form));
      form.value = data.form

      changeState(cloneForm.value.state_id)
      form.value.city_id = cloneForm.value.city_id
    }

    loading.form = false;
  }
  if (!form.value.id) loading.form = false;
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
    const url = form.value.id ? `/maintenance/update/${form.value.id}` : `/maintenance/store`

    form.value.company_id = company.value.id
    form.value.maintenance_type_id = route.params.maintenance_type_id
    if (!form.value.id && hasPermission('maintenance.create.form')) form.value.user_inspector_id = user.value.id;
    form.value.user_made_maintenance_id = form.value.id && hasPermission('maintenance.make.form') ? user.value.id : null;


    const { data, response } = await useAxios(url).post(form.value);

    if (response.status == 200 && data) {
      if (data.code == 200) {
        if (isCreateAndNew.value) {
          clearForm(); // Limpiar el formulario si es "Crear y crear otro"
        } else {
          router.push({ name: 'Maintenance-List' }); // Redirigir si es "Crear"
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
const responseStatus = ref<Array<{ value: string, title: string }>>([])
const responseMaintenanceInput = ref<Array<{ value: string, title: string }>>([])
const responseTypeMaintenance = ref<Array<{ value: string, title: string }>>([])

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
});

const changeVehicle = async (event: Event) => {
  if (event) {

    const url = `/maintenance/getVehicleInfo/${event.value}`

    const { response, data } = await useAxios(url).get();

    if (response.status == 200 && data) {
      vehicleData.value.license_plate = data.vehicle.license_plate
      vehicleData.value.brand_vehicle_name = data.vehicle.brand_vehicle_name
      vehicleData.value.model = data.vehicle.model
      vehicleData.value.vehicle_structure_name = data.vehicle.vehicle_structure_name
      loading.form = false
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
          Información del mantenimiento
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
        <!-- <div v-show="currentTab == (hasPermission('maintenance.make.form') ? item.order - 1 : item.order)" -->
        <div v-show="currentTab == item.order" v-for="(item, index) in tabs" :key="index">
          <VForm :ref="refFormValidate[item.id + '_validate']" @submit.prevent="() => { }"
            :disabled="disabledFiledsView">
            <VRow v-if="index === 0 && hasPermission('maintenance.create.form')">
              <VCol cols="12" sm="6">

                <SelectPlateVehicleForm :requiredField="true" clearable label="Placa del vehículo"
                  :error-messages="errorsBack.vehicle_id" @input="errorsBack.vehicle_id = ''"
                  :rules="[requiredValidator]" @update:model-value="changeVehicle($event)" v-model="form.vehicle_id">
                </SelectPlateVehicleForm>
              </VCol>

              <VCol cols="12" md="6">
                <AppDateTimePicker :rules="[requiredValidator]" :requiredField="true" clearable
                  :error-messages="errorsBack.maintenance_date" @input="errorsBack.maintenance_date = ''"
                  label="Fecha de mantenimiento" :config="{ dateFormat: 'Y-m-d' }" v-model="form.maintenance_date" />
              </VCol>

              <VCol cols="12" sm="6">
                <AppAutocomplete :requiredField="true" clearable :items="states" label="Departamento de operación"
                  @update:model-value="changeState($event)" :error-messages="errorsBack.state_id"
                  @input="errorsBack.state_id = ''" :rules="[requiredValidator]" v-model="form.state_id">
                </AppAutocomplete>
              </VCol>

              <VCol cols="12" sm="6">
                <AppAutocomplete :disabled="cities.length == 0 || disabledFiledsView" :loading="loading.cities"
                  :requiredField="true" clearable :items="cities" label="Ciudad de operación"
                  :error-messages="errorsBack.city_id" @input="errorsBack.city_id = ''" :rules="[requiredValidator]"
                  v-model="form.city_id">
                </AppAutocomplete>
              </VCol>

              <VCol cols="12" sm="6">
                <AppTextField @keypress="onlyNumbersPositivesKeyPress" :requiredField="true" label="Kilometraje"
                  v-model="form.mileage" clearable :errorMessages="errorsBack.mileage" @input="errorsBack.mileage = ''"
                  :rules="[requiredValidator]">
                </AppTextField>
              </VCol>


              <VCol cols="12" sm="6">
                <AppSelect :requiredField="true" clearable :items="responseStatus" v-model="form.status" label="Estado"
                  :error-messages="errorsBack.status" @input="errorsBack.status = ''">
                </AppSelect>
              </VCol>

              <VCol cols="12" sm="6">
                <SelectUserMechanicForm :requiredField="true" clearable label="Asignado a"
                  :error-messages="errorsBack.user_mechanic_id" @input="errorsBack.user_mechanic_id = ''"
                  :rules="[requiredValidator]" v-model="form.user_mechanic_id">
                </SelectUserMechanicForm>
              </VCol>

              <!-- <VCol cols="12" sm="6">
                <SelectUserMechanicForm :disabled="disabledFiledsView || hasPermission('maintenance.create.form')"
                  :requiredField="hasPermission('maintenance.make.form')" clearable label="Realizado por"
                  :error-messages="errorsBack.user_made_maintenance_id"
                  @input="errorsBack.user_made_maintenance_id = ''"
                  :rules="[hasPermission('maintenance.make.form') ? requiredValidator : null]"
                  v-model="form.user_made_maintenance_id">
                </SelectUserMechanicForm>
              </VCol> -->

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
            </VRow>

            <VRow v-else>
              <template v-if="item.maintenance_type_inputs">
                <VCol cols="12" v-for="(itemSelect) in item.maintenance_type_inputs" :key="itemSelect.order">
                  <VCard>
                    <VCardTitle>{{ itemSelect.name }}</VCardTitle>
                    <VCardText>
                      <VRow>
                        <VCol cols="12" md="6">
                          <AppSelect clearable :items="responseMaintenanceInput" v-model="form[itemSelect.id].type"
                            label="Seleccionar" :error-messages="errorsBack[itemSelect.id]"
                            @input="errorsBack[itemSelect.id] = ''">
                          </AppSelect>
                        </VCol>
                        <VCol cols="12" md="6">
                          <AppSelect clearable :items="responseTypeMaintenance"
                            v-model="form[itemSelect.id].type_maintenance" label="Tipo de mantenimiento"
                            :error-messages="errorsBack[itemSelect.id]" @input="errorsBack[itemSelect.id] = ''">
                          </AppSelect>
                        </VCol>
                        <VCol cols="12">
                          <AppTextarea label="Observaciones" v-model="form[itemSelect.id].comment"></AppTextarea>
                        </VCol>
                      </VRow>
                    </VCardText>
                  </VCard>
                </VCol>
              </template>

              <VCol v-if="index === tabs.length - 1" cols="12">
                <AppCardActions noActions
                  subtitle="Registre aquí las observaciones generales o trabajos pendientes del mantenimiento.">
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
