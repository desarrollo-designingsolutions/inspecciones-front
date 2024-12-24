/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck
// Generated by unplugin-vue-router. ‼️ DO NOT MODIFY THIS FILE ‼️
// It's recommended to commit this file.
// Make sure to add this file to your tsconfig.json file as an "includes" or "files" entry.

declare module 'vue-router/auto-routes' {
  import type {
    RouteRecordInfo,
    ParamValue,
    ParamValueOneOrMore,
    ParamValueZeroOrMore,
    ParamValueZeroOrOne,
  } from 'unplugin-vue-router/types'

  /**
   * Route name map generated by unplugin-vue-router
   */
  export interface RouteNamedMap {
    'Login': RouteRecordInfo<'Login', '/', Record<never, never>, Record<never, never>>,
    '$error': RouteRecordInfo<'$error', '/:error(.*)', { error: ParamValue<true> }, { error: ParamValue<false> }>,
    'Company-Form': RouteRecordInfo<'Company-Form', 'company-form/:action/:id?', Record<never, never>, Record<never, never>>,
    'Company-List': RouteRecordInfo<'Company-List', '/Company/List', Record<never, never>, Record<never, never>>,
    'Home': RouteRecordInfo<'Home', '/home', Record<never, never>, Record<never, never>>,
    'second-page': RouteRecordInfo<'second-page', '/second-page', Record<never, never>, Record<never, never>>,
    'user-access-role-components-modal-form': RouteRecordInfo<'user-access-role-components-modal-form', '/UserAccess/Role/Components/ModalForm', Record<never, never>, Record<never, never>>,
    'Role-List': RouteRecordInfo<'Role-List', '/UserAccess/Role/List', Record<never, never>, Record<never, never>>,
    'user-access-users-components-modal-form': RouteRecordInfo<'user-access-users-components-modal-form', '/UserAccess/Users/Components/ModalForm', Record<never, never>, Record<never, never>>,
    'User-List': RouteRecordInfo<'User-List', '/UserAccess/Users/List', Record<never, never>, Record<never, never>>,
  }
}
