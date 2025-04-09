<script setup lang="ts">
import { useAuthenticationStore } from "@/stores/useAuthenticationStore";
import { computed, reactive, ref } from 'vue';

const authenticationStore = useAuthenticationStore();
const emits = defineEmits(["success", "cancel"]);

const itemList = ref<any[]>([]);
const search = ref('');
const componentData = reactive({
    isDialogVisible: false,
    isLoading: false,
});
const inspection = ref<any>({});
const toggleExclusive = ref('Todos')

const itemPerPageOptions = [
    { value: 10, title: '10' },
    { value: 25, title: '25' },
    { value: 50, title: '50' },
    { value: 100, title: '100' },
    { value: -1, title: 'Todos' }
]

const headers = [
    { title: 'Sección', key: 'section' },
    { title: 'Ítem', key: 'item' },
    { title: 'Estado', key: 'status' },
];

const fetchListData = async (inspection_id: string) => {
    componentData.isLoading = true;
    const url = `/inspection/showReportInfo/${inspection_id}`;
    const { response, data } = await useAxios(url).get({
        params: { company_id: authenticationStore.company.id }
    });
    if (response.status === 200 && data) {
        itemList.value = data.info;
    }
    componentData.isLoading = false;
};

const tableRows = computed(() => {
    const rows: any[] = [];
    itemList.value.forEach(tab => {
        tab.inputs.forEach((input: any) => {
            rows.push({
                section: tab.tab_name,
                item: input.input_name,
                status: input.value, // Assuming input.value contains {title, color}
            });
        });
    });
    return rows;
});

// New computed property for filtered rows
const filteredRows = computed(() => {
    let filtered = [...tableRows.value];

    // Filter by toggleExclusive
    if (toggleExclusive.value !== 'Todos') {
        filtered = filtered.filter(row =>
            row.status.title === toggleExclusive.value
        );
    }

    // Filter by search
    if (search.value) {
        const searchLower = search.value.toLowerCase();
        filtered = filtered.filter(row =>
            row.section.toLowerCase().includes(searchLower) ||
            row.item.toLowerCase().includes(searchLower) ||
            row.status.title.toLowerCase().includes(searchLower)
        );
    }

    return filtered;
});

const handleIsDialogVisible = () => {
    componentData.isDialogVisible = !componentData.isDialogVisible;
    search.value = '';
    toggleExclusive.value = 'Todos';
};

const openModal = async (inspectionData: any) => {
    handleIsDialogVisible();
    await fetchListData(inspectionData.id);
    inspection.value = inspectionData;
};

defineExpose({
    openModal,
    componentData,
});
</script>

<template>
    <div>
        <VDialog v-model="componentData.isDialogVisible" max-width="60rem" max-height="80%" persistent>
            <DialogCloseBtn @click="handleIsDialogVisible()" />
            <VCard :loading="componentData.isLoading" :disabled="componentData.isLoading">
                <div>
                    <VToolbar color="primary">
                        <VToolbarTitle>Informe de Inspección</VToolbarTitle>
                    </VToolbar>
                </div>
                <VCardText>
                    <VRow>
                        <VCol cols="12" md="4">
                            <span>
                                <strong>Placa:</strong> <br />
                                {{ inspection.vehicle_license_plate }}
                            </span>
                        </VCol>
                        <VCol cols="12" md="4">
                            <span>
                                <strong>Marca/Modelo:</strong> <br />
                                {{ inspection.vehicle_model }}
                            </span>
                        </VCol>
                        <VCol cols="12" md="4">
                            <span>
                                <strong>Fecha:</strong> <br />
                                {{ inspection.inspection_date }}
                            </span>
                        </VCol>
                        <VCol cols="12" md="4">
                            <span>
                                <strong>Inspector:</strong> <br />
                                {{ inspection.user_inspector_full_name }}
                            </span>
                        </VCol>
                        <VCol cols="12" md="4">
                            <span>
                                <strong>Tipo de inspección:</strong> <br />
                                {{ inspection.inspection_type_name }}
                            </span>
                        </VCol>
                    </VRow>
                </VCardText>

                <VCardText>
                    <VRow>
                        <VCol cols="12">
                            <h3>Elementos con problemas detectados</h3>
                        </VCol>
                    </VRow>
                </VCardText>

                <VCardText v-if="!componentData.isLoading">
                    <VRow>
                        <VCol cols="12">
                            <VBtnToggle v-model="toggleExclusive">
                                <VBtn value="Todos" style="min-inline-size: 100px; white-space: nowrap;">Todos</VBtn>
                                <VBtn v-if="inspection.inspection_type_id == 1" value="Regular"
                                    style="min-inline-size: 100px; white-space: nowrap;">Regular
                                </VBtn>
                                <VBtn v-if="inspection.inspection_type_id == 1" value="Malo"
                                    style="min-inline-size: 100px; white-space: nowrap;">Malo</VBtn>
                                <VBtn v-if="inspection.inspection_type_id == 2" value="No Cumple"
                                    style="min-inline-size: 100px; white-space: nowrap;">No Cumple
                                </VBtn>
                                <VBtn value="Vencido" style="min-inline-size: 100px; white-space: nowrap;">Vencido
                                </VBtn>
                            </VBtnToggle>
                        </VCol>
                        <VCol cols="12">
                            <AppTextField clearable v-model="search" placeholder="Buscar ..."
                                append-inner-icon="tabler-search" single-line hide-details dense outlined />
                        </VCol>
                    </VRow>
                </VCardText>

                <VCardText>
                    <VDataTable v-if="!componentData.isLoading" :headers="headers"
                        items-per-page-text="Elementos por pagina" :items-per-page-options="itemPerPageOptions"
                        :items="filteredRows" :items-per-page="5" class="text-no-wrap">
                        <template #item.status="{ item }">
                            <div class="d-flex align-center gap-3">
                                <VChip label size="small" :color="item.status.color">
                                    {{ item.status.title }}
                                </VChip>
                            </div>
                        </template>

                        <template #no-data>
                            <span>No se encontraron resultados</span>
                        </template>
                    </VDataTable>
                </VCardText>

                <VCardText class="d-flex justify-end gap-3 flex-wrap mt-5">
                    <VBtn color="secondary" :disabled="componentData.isLoading" :loading="componentData.isLoading"
                        @click="handleIsDialogVisible">
                        Cancelar
                    </VBtn>
                </VCardText>
            </VCard>
        </VDialog>
    </div>
</template>
