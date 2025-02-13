<script setup lang="ts">
import { useRoleStore } from "@/pages/UserAccess/Role/stores/useRoleStore";
import { toRef, watch } from 'vue'; // Importa toRef

const roleStore = useRoleStore();
const { selectedElements } = storeToRefs(roleStore);

const props = defineProps({
  father: {
    required: true,
    type: Object,
  },
  operator: {
    required: false,
    type: Boolean,
    default: false,
  },
  mechanic: {
    required: false,
    type: Boolean,
    default: false,
  },
  inspector: {
    required: false,
    type: Boolean,
    default: false,
  },
});

// Mantén la reactividad con toRef
const operator = toRef(props, 'operator');
const mechanic = toRef(props, 'mechanic');
const inspector = toRef(props, 'inspector');

// Verifica si todos los permisos DIRECTOS del grupo están seleccionados
const areAllDirectPermissionsSelected = (father: any) => {
  return father.permissions.every(perm =>
    roleStore.selectedElements.includes(perm.id) && perm.id !== 1
  );
};

// Alterna la selección de todos los permisos DIRECTOS del grupo
const toggleAllDirectPermissions = (father: any) => {
  const allSelected = areAllDirectPermissionsSelected(father);
  if (allSelected) {
    roleStore.deselectAllPermissions(father.id);
  } else {
    roleStore.selectAllPermissions(father.id);
  }
};

const operatorGroups = ["1", "12", "13", "15"]; // IDs de los grupos afectados

watch(operator, (newVal) => {
  if (newVal) {
    roleStore.chekPermissionsSelected(operatorGroups);
  } else {
    roleStore.removePermission(operatorGroups);
  }
});

const mechanicGroups = ["1", "14", "18"]; // IDs de los grupos afectados

watch(mechanic, (newVal) => {
  if (newVal) {
    roleStore.chekPermissionsSelected(mechanicGroups);
  } else {
    roleStore.removePermission(mechanicGroups);
  }
});

const inspectorGroups = ["1", "7", "8", "9", "10", "11", "12", "13", "14", "16", "17"]; // IDs de los grupos afectados

watch(inspector, (newVal) => {
  if (newVal) {
    roleStore.chekPermissionsSelected(inspectorGroups);
  } else {
    roleStore.removePermission(inspectorGroups);
  }
});
</script>

<template>
  <VListGroup>
    <template #activator="{ props }">
      <VListItem v-bind="props" :title="father.title" :prepend-icon="father.icon" />
    </template>

    <VListItem>
      <template v-for="(permission, index) in father.permissions" :key="index">
        <!-- Checkbox "Todos" (solo para el primer elemento y si no es el permiso especial) -->
        <VSwitch v-if="index === 0 && permission.id !== 1" class="mb-2" label="Todos"
          :model-value="areAllDirectPermissionsSelected(father)"
          @update:model-value="toggleAllDirectPermissions(father)" />

        <!-- Checkbox individual -->
        <VSwitch :disabled="permission.id === 1" class="my-0 py-0" :label="permission.description"
          :value="permission.id" v-model="selectedElements" />
      </template>
    </VListItem>

    <!-- Renderizar subgrupos (hijos) -->
    <template v-for="(child, key) in father.children" :key="key">
      <ListGroup :father="child" />
    </template>
  </VListGroup>
</template>
