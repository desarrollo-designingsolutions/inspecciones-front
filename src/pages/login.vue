<script setup lang="ts">
import IErrorsBack from '@/interfaces/Axios/IErrorsBack'
import { router } from '@/plugins/1.router'
import { useAuthenticationStore } from "@/stores/useAuthenticationStore"
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationLight from '@images/pages/auth-v2-login-illustration-light.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'
import type { VForm } from "vuetify/components"

const refForm = ref<VForm>();

definePage({
  path: "/",
  name: "Login",
  meta: {
    layout: 'blank',
    guestOnly: true
  },
})

const authenticationStore = useAuthenticationStore();
const { loading, tokenGoogle, rememberMe } = storeToRefs(authenticationStore);

const errorsBack = ref<IErrorsBack>({});

const form = ref({
  email: '',
  password: '',
  remember: false,
})

const isPasswordVisible = ref(false)

const authThemeImg = useGenerateImageVariant(
  authV2LoginIllustrationLight,
  authV2LoginIllustrationDark,
  authV2LoginIllustrationBorderedLight,
  authV2LoginIllustrationBorderedDark,
  true)

const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

const login = async () => {
  const validation = await refForm.value?.validate();
  if (validation?.valid) {
    const promise = await authenticationStore.login(form);

    if (promise.code == 200) {

      if (isEmpty(promise.user.company_id)) {
        router.push({ name: "Company-List" })
        return
      }
      router.push({ name: "Home" })
    };

    if (promise.code === 422) errorsBack.value = promise.errors ?? {};
  }
}

// Verificar si el usuario está autenticado al cargar el componente
const isAuthenticated = authenticationStore.checkAuthentication();
if (isAuthenticated) {
  router.push({ name: "Home" }) // Redirige a la página de inicio si ya está autenticado
}

</script>
<template>
  <div class="auth-wrapper d-flex align-center justify-center pa-4">

    <div class="login-bg" :style="{
      backgroundImage: `url('/images/LoginInspecciones.jpg')`,
    }"></div>

    <div class="position-relative my-sm-16">
      <!-- 👉 Auth Card -->
      <VCard class="auth-card transparent-card" max-width="460" :class="$vuetify.display.smAndUp ? 'pa-6' : 'pa-2'">

        <VCardText class="d-flex justify-center">
          <h3 class="text-h3 white-text">
            Bienvenido a Inspecciones
          </h3>
        </VCardText>

        <VCardText>
          <VForm ref="refForm" @submit.prevent="() => { }">
            <VRow>
              <!-- email -->
              <VCol cols="12">
                <AppTextField class="transparent-field" :requiredField="true" v-model="form.email" autofocus
                  label="Correo electrónico" type="email" placeholder="johndoe@email.com" />
              </VCol>

              <!-- password -->
              <VCol cols="12">
                <AppTextField class="transparent-field" :requiredField="true" v-model="form.password" label="Contraseña"
                  placeholder="············" :type="isPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible" />

                <!-- remember me checkbox -->
                <div class="d-flex align-center flex-wrap justify-space-between mt-1 mb-4">
                  <VCheckbox class="white-checkbox" v-model="rememberMe" label="Recuérdame" />

                  <RouterLink class="text-primary ms-2 mb-1" :to="{ name: 'ForgotPassword' }">
                    ¿Ha olvidado su contraseña?
                  </RouterLink>
                </div>

                <!-- login button -->
                <VBtn class="floating-btn mt-2" :loading="loading" :disabled="loading" block type="submit"
                  @click="login()">
                  Ingresar
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </div>
  </div>
</template>


<style lang="scss" scoped>
.login-bg {
  position: fixed;
  z-index: 0;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  block-size: 100%;
  inline-size: 100%;
  inset-block-start: 0;
  inset-inline-start: 0;
}

.auth-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  min-block-size: 100vh;
}

// Fondo de pantalla con la imagen
.login-bg {
  position: fixed;
  z-index: 0;
  background-image: url("/images/LoginInspecciones.png");
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  inset: 0;
}

// La tarjeta de login con fondo semitransparente
.auth-card.transparent-card {
  position: relative;
  z-index: 1;
  border-radius: 8px;
  backdrop-filter: blur(4px);

  /* Ajusta el color y la opacidad a tu gusto.
     Si prefieres un velo blanco, usa rgba(255, 255, 255, 0.3) */
  background-color: rgba(26, 24, 54, 36.3%) !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 20%);
  color: #fff !important;

  /* Para que todo el texto interno sea blanco */
}

// Clase para forzar texto blanco
.white-text {
  color: #fff !important;
}

// Inputs transparentes con texto y labels blancos
.transparent-field ::v-deep .v-field {
  border: 1px solid rgba(255, 255, 255, 50%) !important;
  background-color: transparent !important;
  color: #fff !important;
}

.transparent-field ::v-deep .v-label {
  color: #fff !important;
}

.transparent-field {

  /* Fuerza el color del texto del input */
  ::v-deep input {
    color: #fff !important;
  }

  /* Placeholder en blanco */
  ::v-deep input::placeholder {
    color: #fff !important;
  }

  /* Elimina el fondo blanco de autocompletar y fuerza texto a blanco */
  ::v-deep input:-webkit-autofill,
  ::v-deep input:-webkit-autofill:hover,
  ::v-deep input:-webkit-autofill:focus,
  ::v-deep input:-webkit-autofill:active {
    /* Ajusta el color o la transparencia del fondo
       (puedes usar rgba(26, 24, 54, 0.5) o el que prefieras) */
    box-shadow: 0 0 0 1000px rgb(32, 32, 60) inset !important;
    -webkit-text-fill-color: #fff !important;
  }

  /* Ícono clearable en blanco */

  /* Ajusta el selector según la versión de Vuetify:
     - .v-field__clearable, .v-text-field__clearable
     - .v-field__append-inner, .v-input__append-inner
  */
  ::v-deep .v-field__clearable .v-icon,
  ::v-deep .v-text-field__clearable .v-icon,
  ::v-deep .v-field__append-inner .v-icon,
  ::v-deep .v-input__append-inner .v-icon {
    color: #fff !important;
  }
}

// Checkbox y su label en blanco
.white-checkbox :deep(.v-input--selection-controls__input) {
  border-color: #fff !important;
}

.white-checkbox :deep(.v-label) {
  color: #fff !important;
}

// Enlace de "¿Ha olvidado su contraseña?" en blanco
.forgot-password-link {
  color: #fff !important;

  &:hover {
    text-decoration: underline;
  }
}

// Botón con efecto semitransparente
.floating-btn {
  border: 1px solid rgba(255, 255, 255, 30%);
  background-color: rgba(255, 255, 255, 20%) !important;
  color: #fff !important;

  &:hover {
    background-color: rgba(255, 255, 255, 30%) !important;
  }
}
</style>
