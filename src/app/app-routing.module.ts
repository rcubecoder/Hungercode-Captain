import { NgModule } from '@angular/core'
import { PreloadAllModules, RouterModule, Routes } from '@angular/router'
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component'
import { LoginComponent } from './components/login/login.component'
import { NotFoundComponent } from './components/not-found/not-found.component'
import { TabsComponent } from './components/tabs/tabs.component'
import { AuthguardService } from './services/authguard.service'

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
    data: { showTabs: false },
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    data: { showTabs: false },
  },
  {
    path: 'tabs',
    component: TabsComponent,
    children: [
      {
        path: '',
        redirectTo: '/tabs/table',
        pathMatch: 'full',
      },
      {
        path: 'table',
        loadChildren: () =>
          import('./pages/table/table.module').then((m) => m.TablePageModule),
      },
      {
        path: 'menu',
        loadChildren: () =>
          import('./pages/menu/menu.module').then((m) => m.MenuPageModule),
        canActivate: [AuthguardService],
        data: { component: 'menu' },
      },

      {
        path: 'cart',
        loadChildren: () =>
          import('./pages/cart/cart.module').then((m) => m.CartPageModule),
      },

      {
        path: 'search',
        loadChildren: () =>
          import('./pages/search/search.module').then(
            (m) => m.SearchPageModule,
          ),
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./pages/setting/setting.module').then(
            (m) => m.SettingPageModule,
          ),
      },
    ],
  },

  {
    path: 'not-found/:message',
    component: NotFoundComponent,
    data: { showTabs: false },
  },
  {
    path: '**',
    redirectTo: '/not-found/',
  },
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
