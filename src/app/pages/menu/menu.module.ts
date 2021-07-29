import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { MenuPageRoutingModule } from './menu-routing.module'

import { MenuPage } from './menu.page'
import { OrderService } from 'src/app/services/order.service'
import {
  AngularFirestoreModule,
  AngularFirestore,
} from '@angular/fire/firestore'
import { TabsComponent } from 'src/app/components/tabs/tabs.component'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MenuPageRoutingModule,
    AngularFirestoreModule,
  ],
  declarations: [MenuPage],
  providers: [AngularFirestore],
})
export class MenuPageModule {}
