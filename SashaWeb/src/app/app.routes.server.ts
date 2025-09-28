import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Rute pentru Angular Universal (SSR)
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: 'profile',
    renderMode: RenderMode.Server, // se randă doar pe server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender, // restul paginilor sunt prerenderizate
  },
];
