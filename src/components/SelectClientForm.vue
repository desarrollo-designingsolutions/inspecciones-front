<script setup lang="ts">
import ClientForm from "@/pages/Client/Form.vue";
import { useAuthenticationStore } from "@/stores/useAuthenticationStore";
const authenticationStore = useAuthenticationStore();

const emit = defineEmits(["execute", "update:modelValue"])

const elementId = computed(() => {
  const attrs = useAttrs();
  const _elementIdToken = attrs.id || attrs.label;
  return _elementIdToken
    ? `app-selectInifinite-field-${_elementIdToken}-${Math.random()
      .toString(36)
      .slice(2, 7)}`
    : undefined;
});

const isDialogVisible = ref<boolean>(false)
const handleDialogVisible = () => {
  isDialogVisible.value = !isDialogVisible.value;
};

const openDialog = async () => {
  handleDialogVisible();
};
defineExpose({
})


const disabled = computed(() => useAttrs().disabled as boolean | undefined);
const title = ref<string>("Formulario cliente")
const isLoading = ref<boolean>(false)
const valueSelectInfinite = ref()

//SELECT INFINITE  

const client_arrayInfo = ref<Array<object>>([])
const client_countLinks = ref<number>(1)
const fetchSelectInifiniteClient = async (params: object) => {
  const { data, response } = await useApi("/selectInfiniteClient").post(params)

  if (response.value?.ok && data.value) {
    client_arrayInfo.value = data.value.client_arrayInfo
    client_countLinks.value = data.value.client_countLinks
  }
}
const select_client = useSelect(
  fetchSelectInifiniteClient,
  client_arrayInfo,
  client_countLinks,
  {
    company_id: authenticationStore.company.id
  }
);

const loadSelectInfinite = async () => {
  await fetchSelectInifiniteClient({
    company_id: authenticationStore.company.id
  })

  select_client.dataNueva.value = client_arrayInfo.value
  select_client.totalLinks.value = client_countLinks.value

}
onMounted(() => {
  valueSelectInfinite.value = useAttrs().modelValue
  emit("update:modelValue", useAttrs().modelValue);

  loadSelectInfinite()
})

const getDataSaved = (data: any) => {
  if (isObject(data)) {
    const title = `${data.name}`
    valueSelectInfinite.value = {
      value: data.id,
      title: title,
    }
    emit("update:modelValue", valueSelectInfinite.value);

    loadSelectInfinite()
  }

  handleDialogVisible()

}

</script>

<template>
  <div>
    <SelectInfinite class="mt-1" :loading="isLoading" returnObject
      @update:modelValue="emit('update:modelValue', $event)" v-model="valueSelectInfinite" :select="select_client"
      clearable v-bind="{
        ...$attrs,
        id: elementId,
      }">


      <template #append>
        <VBtn icon color="success" @click="openDialog()">
          <VIcon icon="tabler-plus" />
        </VBtn>
      </template>

    </SelectInfinite>

    <VDialog v-model="isDialogVisible" :overlay="false" max-width="30rem" transition="dialog-transition" persistent>
      <DialogCloseBtn @click="handleDialogVisible" />
      <VCard :title="title" :loading="isLoading" :disabled="isLoading">
        <VCardText>
          <ClientForm @closeModal="getDataSaved" :btnBack="false" :saveAndCloseModal="true" :btnCancel="true"
            :styleModal="true" />
        </VCardText>
      </VCard>
    </VDialog>



  </div>
</template>
