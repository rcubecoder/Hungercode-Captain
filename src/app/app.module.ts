import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { RouteReuseStrategy } from '@angular/router'

import { IonicModule, IonicRouteStrategy } from '@ionic/angular'

import { AppComponent } from './app.component'
import { AppRoutingModule } from './app-routing.module'
import { MenuoptionsComponent } from './components/menuoptions/menuoptions.component'
import { TabsComponent } from './components/tabs/tabs.component'
import { OrderService } from './services/order.service'
import {
  AngularFirestore,
} from '@angular/fire/firestore'
import { AngularFireModule } from '@angular/fire'

import { AngularFireAuthModule } from '@angular/fire/auth'
import { FormsModule } from '@angular/forms'

import { LoginComponent } from './components/login/login.component'

import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http'

import { InterceptorService } from './services/interceptor.service'
import { NgxSpinnerModule } from 'ngx-spinner'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { NotFoundComponent } from './components/not-found/not-found.component'
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component'
import { environment } from 'src/environments/environment'

@NgModule({
  declarations: [
    AppComponent,
    MenuoptionsComponent,
    TabsComponent,
    LoginComponent,
    NotFoundComponent,
    ForgotPasswordComponent,
  ],
  entryComponents: [
    MenuoptionsComponent,
    LoginComponent,
    ForgotPasswordComponent,
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireAuthModule,
    FormsModule,
    HttpClientModule,
    NgxSpinnerModule,
    BrowserAnimationsModule,
  ],
  providers: [
    OrderService,
    AngularFirestore,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: InterceptorService,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
