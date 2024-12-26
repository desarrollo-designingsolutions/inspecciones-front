<script setup lang="ts">

const { loading } = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  showCreateAndNew: {
    type: Boolean,
    default: true
  },
})

const emit = defineEmits(["execute"])

const submitForm = (isCreateAndNew: boolean = false) => {
  emit("execute", isCreateAndNew)
}

</script>
<template>
  <div class="d-flex justify-end gap-3 flex-wrap ">
    <VBtn :disabled="disabled" :loading="loading" @click="submitForm()" color="primary">
      Guardar
    </VBtn>
    <VBtn v-if="showCreateAndNew" :disabled="disabled" :loading="loading" @click="submitForm(true)" color="primary">
      Guardar y crear otro
    </VBtn>
  </div>
</template>
