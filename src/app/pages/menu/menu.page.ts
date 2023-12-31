import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  OnDestroy,
} from '@angular/core';
import {
  ModalController,
  ViewWillEnter,
  ToastController,
} from '@ionic/angular';
import { Animation, createAnimation } from '@ionic/core';
import { OrderService } from 'src/app/services/order.service';

import { MenuoptionsComponent } from 'src/app/components/menuoptions/menuoptions.component';
import { AngularFirestoreCollection } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { DbService } from 'src/app/services/db.service';
import { AuthService } from 'src/app/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
})
export class MenuPage implements ViewWillEnter, OnDestroy {
  constructor(
    private modalController: ModalController,
    private orderService: OrderService,
    private dbService: DbService,
    private toast: ToastController,
    private authService: AuthService,
    private router: Router
  ) {
    //////this.orderService.addMenuToFirestore()
  }

  animEnter = function modalEnterAnimation(
    rootElement: HTMLElement
  ): Animation {
    return createAnimation()
      .addElement(rootElement.querySelector('.modal-wrapper'))
      .duration(200)
      .fromTo('transform', 'translateY(100%)', 'translateY(0)')
      .fromTo('opacity', 1, 1);
  };
  animExit = function modalEnterAnimation(rootElement: HTMLElement): Animation {
    return createAnimation()
      .addElement(rootElement.querySelector('.modal-wrapper'))
      .duration(200)
      .fromTo('transform', 'translateY(0)', 'translateY(100%)')
      .fromTo('opacity', 1, 1);
  };
  selectedItems: number = 0;
  selectedTable;
  menuCards = [];
  type;

  cardColors = ['#e4efe0', '#e4e3f1', '#dceaf3', '#f6dfd4', '#f3f3f3'];
  orderItems = [];
  categories: any;
  category: any;
  mainMenu: any;
  token = '';
  drive_url = 'https://drive.google.com/uc?id=';
  subscription: Subscription;
  async ionViewWillEnter() {
    let table = localStorage.getItem('selectedTable');
    let type = localStorage.getItem('type');
    this.selectedTable = table ? table : '';
    this.type = type ? type : '';


    this.categories = await this.dbService.getCategories();
    let cat = await this.dbService.getCategory();
    if (!cat) {
      cat = this.categories[0];
    }
    if (this.category == cat) {
      await this.chooseMenucards();
    } else {
      this.category = cat;
      await this.chooseMenucards();
    }

    this.orderItems = await this.orderService.getOrderItems();

    this.orderItems.map((item) => {
      if (this.category == 'Special' || this.category == item.category) {
        let index = this.menuCards
          .map((ele) => {
            return ele.id;
          })
          .indexOf(item.id);

        if (index != -1) {
          if (item.customize == false) {
            this.menuCards[index].customize = item.data[0].qty;
          } else {
            this.menuCards[index].customize = item.data.length;
          }
        }
      }
    });
  }

  async segmentChanged(event) {
    this.category = event.detail.value;
    await this.chooseMenucards();
    this.orderItems.map((item) => {
      if (this.category == 'Special' || this.category == item.category) {
        let index = this.menuCards
          .map((ele) => {
            return ele.id;
          })
          .indexOf(item.id);
        if (index != -1) {
          if (item.customize == false) {
            this.menuCards[index].customize = item.data[0].qty;
          } else {
            this.menuCards[index].customize = item.data.length;
          }
        }
      }
    });
  }

  async chooseMenucards() {
    if (this.category) {
      this.menuCards = await this.dbService.getMenu(this.category);
    }
  }

  increase(id, price, index, e) {
    e.stopPropagation();
    let i = this.orderItems.findIndex((item) => {
      return item.id == id;
    });
    this.menuCards[index].customize++;
    let item = { ...this.orderItems[i].data[0] };
    item.qty++;
    item.price += price;
    this.orderItems[i].data[0] = item;
    this.orderService.setOrderItems(
      JSON.parse(JSON.stringify(this.orderItems))
    );
  }

  decrease(id, price, index, e) {
    e.stopPropagation();
    let i = this.orderItems.findIndex((item) => {
      return item.id == id;
    });
    this.menuCards[index].customize--;
    let item = { ...this.orderItems[i].data[0] };
    if (item.qty == 1) {
      this.orderItems.splice(i, 1);
    } else {
      item.qty--;
      item.price -= price;
      this.orderItems[i].data[0] = item;
    }
    this.orderService.setOrderItems(
      JSON.parse(JSON.stringify(this.orderItems))
    );
  }

  removeOrderItem(id, index, e) {
    e.stopPropagation();
    this.orderItems = this.orderService.removeOrderItem(this.category, id);
    this.menuCards[index].customize = 0;
  }

  menuOptionMenu: any;
  async openOptions(menu, index, type, e) {
    e.stopPropagation();
    this.menuOptionMenu = menu;
    if (menu.disPrice) {
      this.menuOptionMenu.price = menu.disPrice;
    }

    if (menu.addon?.length == 0 && menu.variant?.length == 0) {
      if(this.menuCards[index].customize != 0){
        return
      }
      this.menuCards[index].customize++;
      let item = {
        name: menu.name,
        price: menu.price,
        category: menu.category,
        addon: [],
        variant: {},
        qty: 1,
      };
      this.orderItems.push({
        id: menu.id,
        customize: false,
        data: [item],
        category: menu.category,
      });
      this.orderService.setOrderItems(
        JSON.parse(JSON.stringify(this.orderItems))
      );
      return;
    }
    const modalOptions = Object.assign({}, menu);
    let selectedItems: any;
    let orderitems: any, tempIndex: number;
    if (type == 'customize') {
      orderitems = [...this.orderItems];
      tempIndex = orderitems.findIndex((i) => {
        return i.id == menu.id;
      });
      selectedItems = this.orderItems[tempIndex].data;
    } else {
      selectedItems = null;
    }

    const modal = await this.modalController.create({
      component: MenuoptionsComponent,
      cssClass: 'food-options-container',
      animated: true,
      backdropDismiss: false,
      enterAnimation: this.animEnter,
      leaveAnimation: this.animExit,
      componentProps: {
        modalOptions: modalOptions,
        selectedItems: selectedItems,
      },
    });
    await modal.present();
    this.orderService.setModelStatus(true);
    await modal.onDidDismiss().then((order) => {
      this.menuOptionMenu = {};
      this.orderService.setModelStatus(false);
      if(!order.data){
        return
      }
      if (order.data.length != 0) {
        if (type == 'customize') {
          orderitems[tempIndex].data = order.data;
          this.orderItems = orderitems;
          this.menuCards[index].customize = order.data.length;
        } else {
          this.orderItems.push({
            category: menu.category,
            id: menu.id,
            data: order.data,
            customize: true,
          });
        
          this.menuCards[index].customize = order.data.length;
        }
        this.orderService.setOrderItems(
          JSON.parse(JSON.stringify(this.orderItems))
        );
      } else {
        if (type == 'customize') {
          orderitems.splice(tempIndex, 1);
          this.orderItems = orderitems;
        }
        this.menuCards[index].customize = 0;
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
