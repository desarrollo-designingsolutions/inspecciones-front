<script lang="ts" setup>
import { useToast } from '@/composables/useToast';
import IErrorsBack from "@/interfaces/Axios/IErrorsBack";
import { router } from '@/plugins/1.router';
import { useAuthenticationStore } from "@/stores/useAuthenticationStore";
import type { VForm } from 'vuetify/components/VForm';


definePage({
  path: "Type-Document-form/:action/:id?",
  name: "Type-Document-Form",
  meta: {
    redirectIfLoggedIn: true,
    requiresAuth: true,
    requiredPermission: "menu.type.document",
  },
});

const emit = defineEmits(["closeModal"]);

const { btnCancel, btnBack, saveAndCloseModal, styleModal } = defineProps({
  btnCancel: {
    type: Boolean,
    default: false,
  },
  btnBack: {
    type: Boolean,
    default: true,
  },
  saveAndCloseModal: {
    type: Boolean,
    default: false,
  },
  styleModal: {
    type: Boolean,
    default: false,
  },
});


const authenticationStore = useAuthenticationStore();
const { company } = storeToRefs(authenticationStore)
const { toast } = useToast()
const errorsBack = ref<IErrorsBack>({});
const disabledFiledsView = ref<boolean>(false);
const route = useRoute()
const formValidation = ref<VForm>()
const loading = reactive({
  form: false,
})

const form = ref({
  id: null as string | null,
  company_id: null as string | null,
  name: null as string | null,
})

const clearForm = () => {
  for (const key in form.value) {
    form.value[key] = null
  }
}



const fetchDataForm = async () => {

  form.value.id = route.params.id || null

  const url = styleModal ? '/type-document/create' : (form.value.id ? `/type-document/${form.value.id}/edit` : '/type-document/create');

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

    //formulario 
    if (data.value.form) {
      form.value = data.value.form
    }
  }
}

const submitForm = async (isCreateAndNew: boolean = false) => {
  const validation = await formValidation.value?.validate()
  if (validation?.valid) {

    form.value.company_id = authenticationStore.company.id;

    const url = form.value.id ? `/type-document/update/${form.value.id}` : `/type-document/store`

    loading.form = true;
    const { data, response } = await useApi(url).post(form.value);
    loading.form = false;



    if (response.value?.ok && data.value) {

      if (data.value.code == 200) {

        if (saveAndCloseModal) {
          emit("closeModal", data.value.data)
          return false
        }

        if (isCreateAndNew) {
          clearForm(); // Limpiar el formulario si es "Crear y crear otro"
        } else {
          router.push({ name: 'Type-Document-List' }); // Redirigir si es "Crear"
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

onMounted(async () => {
  clearForm()
  if (!styleModal && route.params.id) {
    await fetchDataForm()
  }
})

// Computed que verifica si al menos uno de los valores es true
const isLoading = computed(() => {
  return Object.values(loading).some(value => value);
});

const handlerCancel = () => {
  emit("closeModal")
}

</script>


<template>
  <div>
    <VCard :disabled="loading.form" :loading="loading.form">
      <VCardTitle class="d-flex justify-space-between">
        <span>
          Información del documento
        </span>
      </VCardTitle>
      <VCardText>

        <VForm ref="formValidation" @submit.prevent="() => { }" :disabled="disabledFiledsView">
          <VRow>
            <VCol cols="12" :md="styleModal ? 12 : 6">
              <AppTextField :requiredField="true" :rules="[requiredValidator]" v-model="form.name" label="Nombre"
                :error-messages="errorsBack.name" @input="errorsBack.name = ''" clearable />
            </VCol>
          </VRow>

        </VForm>

      </VCardText>

      <VCardText class="d-flex justify-end gap-3 flex-wrap mt-5">
        <BtnBack :disabled="isLoading" :loading="isLoading" v-if="btnBack" />
        <VBtn v-if="btnCancel" :disabled="isLoading" :loading="isLoading" @click="handlerCancel()" color="secondary">
          Cancelar
        </VBtn>
        <BtnSave v-if="!disabledFiledsView" :disabled="isLoading" :loading="isLoading" :showCreateAndNew="!btnCancel"
          @execute="submitForm" />
      </VCardText>
    </VCard>
  </div>
</template>
