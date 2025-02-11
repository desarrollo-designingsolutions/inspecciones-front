<script setup lang="ts">
import IErrorsBack from "@/interfaces/Axios/IErrorsBack";
import moment from "moment";
import type { VForm } from "vuetify/components/VForm";

import { useAuthenticationStore } from "@/stores/useAuthenticationStore";
const authenticationStore = useAuthenticationStore();
const { company } = storeToRefs(authenticationStore)

const errorsBack = ref<IErrorsBack>({});
const refForm = ref<VForm>();
const emit = defineEmits(["execute"])

const titleModal = ref<string>("Crear usuario")
const isDialogVisible = ref<boolean>(false)
const disabledFiledsView = ref<boolean>(false)

const isLoading = ref<boolean>(false)

const form = ref({
  id: null as null | string,
  name: null as null | string,
  surname: null as null | string,
  email: null as null | string,
  password: null as null | string,
  confirmedPassword: null as null | string,
  role_id: null as null | string,
  company_id: null as null | string,
  type_document_id: null as null | string,
  document: null as null | string,
  type_license_id: null as null | string,
  license: null as null | string,
  expiration_date: null as null | string,
})

const handleClearForm = () => {
  for (const key in form.value) {
    form.value[key] = null
  }
}

const handleDialogVisible = () => {
  isDialogVisible.value = !isDialogVisible.value;
};

const openModal = async (id: string | null = null, disabled: boolean = false) => {
  disabledFiledsView.value = disabled
  operator.value = false

  handleClearForm()
  handleDialogVisible();

  titleModal.value = id ? "Editar usuario" : "Crear usuario"
  titleModal.value = disabledFiledsView.value ? "Visualizar usuario" : titleModal.value

  form.value.id = id
  form.value.company_id = company.value.id
  await fetchDataForm();
};

const roles = ref([])
const typeDocuments = ref([])
const typeLicenses = ref([])
const companies = ref([])
const operator = ref(false)
const fetchDataForm = async () => {

  const url = form.value.id ? `/user/${form.value.id}/edit` : `/user/create`

  isLoading.value = true
  const { data, response } = await useApi<any>(
    createUrl(url, {
      query: {
        company_id: company.value.id
      },
    })
  );
  isLoading.value = false

  if (response.value?.ok && data.value) {
    roles.value = data.value.roles
    typeDocuments.value = data.value.typeDocuments
    typeLicenses.value = data.value.typeLicenses
    companies.value = data.value.companies

    if (data.value.form) {
      const cloneForm = JSON.parse(JSON.stringify(data.value.form))
      form.value = data.value.form
      changeRole(cloneForm.role_id)
    }
  }
}


const submitForm = async () => {
  const validation = await refForm.value?.validate();

  if (validation?.valid) {

    const url = form.value.id ? `/user/update/${form.value.id}` : `/user/store`

    isLoading.value = true
    const { response, data } = await useApi(url).post(form.value);
    isLoading.value = false

    if (response.value?.ok && data.value) {
      emit("execute")
      handleDialogVisible()
    }

    if (data.value.code === 422) errorsBack.value = data.value.errors ?? {};
  }
}

const rulesFieldPassword = computed(() => {
  if (!form.value.id) {
    return [
      value => requiredValidator(value),
    ]
  }
  return []
})
const rulesFieldConfirmedPassword = computed(() => {
  if (!form.value.id) {
    return [
      value => requiredValidator(value),
      value => confirmedValidator(form.value.password, value),
    ]
  }
  return [
    value => confirmedValidator(form.value.password, value),
  ]
})

const changeRole = (event: any) => {
  if (event) {
    operator.value = event.operator
  }
}

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1; // Los meses van de 0 a 11, por lo que sumamos 1
const currentDay = now.getDate();

const changeFinalDate = (event: any) => {
  if (event) {
    let d1 = moment(`${currentYear}-${currentMonth.toString().padStart(2, '0')}-${currentDay.toString().padStart(2, '0')}`);
    let d2 = moment(event);
    errorsBack.value.expiration_date = "";
    if (!d2.isAfter(d1))
      errorsBack.value.expiration_date = `La fecha debe ser posterior a ${d1.format('YYYY-MM-DD')}`;
  }
}


const nameRules = [
  value => requiredValidator(value),
  value => maxCharacters(value, 100),
  value => minCharacters(value, 2),
];

const typeDocumentRules = [
  value => requiredValidator(value),
  value => maxCharacters(value, 20),
  value => integerValidator(value),
  value => positiveNumberValidator(value),
]

const typeLicenseRules = [
  value => requiredValidator(value),
  value => integerValidator(value),
  value => positiveNumberValidator(value),
  value => maxCharacters(value, 10),
  value => minCharacters(value, 4),
  value => value != form.value.document ? 'El documento y la licencia deben ser iguales' : true,
]

defineExpose({
  openModal
})

</script>

<template>
  <div>
    <VDialog v-model="isDialogVisible" :overlay="false" max-width="50rem" transition="dialog-transition" persistent>
      <DialogCloseBtn @click="handleDialogVisible" />
      <VCard :loading="isLoading" :disabled="isLoading" class="w-100">
        <!-- Toolbar -->
        <div>
          <VToolbar color="primary">
            <VToolbarTitle>{{ titleModal }}</VToolbarTitle>
          </VToolbar>
        </div>

        <VCardText>
          <VForm ref="refForm" @submit.prevent="() => { }">

            <VRow>
              <VCol cols="12" md="6">
                <AppTextField :requiredField="true" clearable :disabled="disabledFiledsView" label="Nombres"
                  :rules="nameRules" v-model="form.name" :error-messages="errorsBack.name" />
              </VCol>
              <VCol cols="12" md="6">
                <AppTextField :requiredField="true" clearable :disabled="disabledFiledsView" label="Apellidos"
                  :rules="nameRules" v-model="form.surname" :error-messages="errorsBack.surname" />
              </VCol>

              <VCol cols="12" :md="disabledFiledsView ? 6 : 4">
                <AppTextField :disabled="disabledFiledsView" :requiredField="true" clearable
                  :rules="[requiredValidator]" v-model="form.email" label="Email" :error-messages="errorsBack.email"
                  @input="errorsBack.email = ''" />
              </VCol>

              <VCol cols="12" md="4" v-if="!disabledFiledsView">
                <AppTextField :requiredField="true" clearable :disabled="disabledFiledsView" label="Contraseña"
                  type="password" :rules="rulesFieldPassword" v-model="form.password"
                  :error-messages="errorsBack.password" />
              </VCol>

              <VCol cols="12" md="4" v-if="!disabledFiledsView">
                <AppTextField :requiredField="true" label="Confirmar Contraseña" type="password"
                  :rules="rulesFieldConfirmedPassword" v-model="form.confirmedPassword" />
              </VCol>

              <VCol cols="12" md="6">
                <AppSelect :requiredField="true" :items="roles" returnObject @update:model-value="changeRole($event)"
                  label="Rol" :rules="[requiredValidator]" v-model="form.role_id" :error-messages="errorsBack.role_id"
                  clearable :disabled="disabledFiledsView" />
              </VCol>
              <VCol cols="12" md="6" v-if="operator">
                <AppSelect :requiredField="true" :items="typeDocuments" label="Tipo de documentos"
                  :rules="[requiredValidator]" v-model="form.type_document_id"
                  :error-messages="errorsBack.type_document_id" clearable :disabled="disabledFiledsView" />
              </VCol>

              <VCol cols="12" md="6" v-if="operator">
                <AppTextField :disabled="disabledFiledsView" :requiredField="true" label="Número de documento"
                  :rules="typeDocumentRules" v-model="form.document" :error-messages="errorsBack.document" />
              </VCol>

              <VCol cols="12" md="6" v-if="operator">
                <AppSelect :requiredField="true" :items="typeLicenses" label="Tipo de licencias"
                  :rules="[requiredValidator]" v-model="form.type_license_id"
                  :error-messages="errorsBack.type_license_id" clearable :disabled="disabledFiledsView" />
              </VCol>

              <VCol cols="12" md="6" v-if="operator">
                <AppTextField @keypress="onlyNumbersPositivesKeyPress" :disabled="disabledFiledsView"
                  :requiredField="true" label="Numero de licencia" :rules="typeLicenseRules" v-model="form.license"
                  :error-messages="errorsBack.license" />
              </VCol>

              <VCol cols="12" md="6" v-if="operator">
                <AppDateTimePicker :disabled="disabledFiledsView" :requiredField="true" clearable
                  :error-messages="errorsBack.expiration_date" @input="errorsBack.expiration_date = ''"
                  v-model="form.expiration_date" :rules="[requiredValidator]" label="Fecha de expiración de licencia"
                  @update:model-value="changeFinalDate($event)"
                  :config="{ dateFormat: 'Y-m-d', disable: [{ from: `2020-01-01`, to: `${currentYear}-${currentMonth}-${currentDay}` }] }" />
              </VCol>

            </VRow>

          </VForm>
        </VCardText>

        <VCardText class="d-flex justify-end gap-3 flex-wrap mt-5">
          <VBtn color="secondary" :disabled="isLoading" :loading="isLoading" @click="handleDialogVisible">Cancelar
          </VBtn>
          <VBtn v-if="!disabledFiledsView" :disabled="isLoading" :loading="isLoading" @click="submitForm()"
            color="primary">
            Guardar
          </VBtn>
        </VCardText>


      </VCard>
    </VDialog>



  </div>
</template>
