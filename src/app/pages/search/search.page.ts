import { Component, OnInit } from "@angular/core";
import { ModalController, ViewWillEnter } from "@ionic/angular";
import { MenuoptionsComponent } from "src/app/components/menuoptions/menuoptions.component";
import { DbService } from "src/app/services/db.service";
import { OrderService } from "src/app/services/order.service";
import { Animation, createAnimation } from "@ionic/core";

@Component({
  selector: "app-search",
  templateUrl: "./search.page.html",
  styleUrls: ["./search.page.scss"],
})
export class SearchPage implements ViewWillEnter {
  constructor(
    private dbService: DbService,
    private orderService: OrderService,
    private modalController: ModalController
  ) {}

  animEnter = function modalEnterAnimation(
    rootElement: HTMLElement
  ): Animation {
    return createAnimation()
      .addElement(rootElement.querySelector(".modal-wrapper"))
      .duration(200)
      .fromTo("transform", "translateY(100%)", "translateY(0)")
      .fromTo("opacity", 1, 1);
  };
  animExit = function modalEnterAnimation(rootElement: HTMLElement): Animation {
    return createAnimation()
      .addElement(rootElement.querySelector(".modal-wrapper"))
      .duration(200)
      .fromTo("transform", "translateY(0)", "translateY(100%)")
      .fromTo("opacity", 1, 1);
  };

  menuCards: any = [];
  tempMenuCards: any = [];
  pushSearch = [];
  cardColors = ["#e4efe0", "#e4e3f1", "#dceaf3", "#f6dfd4", "#f3f3f3"];
  drive_url = "https://drive.google.com/thumbnail?id=";
  orderItems: any = [];
  async ionViewWillEnter() {
    console.log('ionViewWillEnter')
    this.menuCards = [...this.dbService.searchMenu];

    if (this.menuCards.length == 0) {
      this.getMenu();
    }

    this.orderItems = this.orderService.getOrderItems();

    this.orderItems.map((item) => {
      let index = this.tempMenuCards
      .map((ele) => {
      return ele.id;
      })
      .indexOf(item.id);
      if (index != -1) {
      if (item.customize == false) {
      this.tempMenuCards[index].customize = item.data[0].qty;
      } else {
      this.tempMenuCards[index].customize = item.data.length;
      }
      }
      });
      
  }

  async getMenu() {
    this.menuCards = [];
    let token: any = await this.orderService.decryptToken();
    this.dbService
      .getMenuFromFirestoreByRestId(token.rest_id)
      .subscribe((res: any) => {
        this.menuCards = [...res.data().menu];
      });
  }

  searchForFood(event) {
    let word = event.target.value.toLowerCase();

    if (word.length >= 2) {
      this.tempMenuCards = [];
      for (let menu of this.menuCards) {
        if (menu.name.toLowerCase().includes(word)) {
          this.tempMenuCards.push(menu);
        }
      }
      this.orderItems.map((item) => {
        let index = this.tempMenuCards
          .map((ele) => {
            return ele.id;
          })
          .indexOf(item.id);
        if (index != -1) {
          if (item.customize == false) {
            this.tempMenuCards[index].customize = item.data[0].qty;
          } else {
            this.tempMenuCards[index].customize = item.data.length;
          }
        }
      });
    } else {
      this.tempMenuCards = [];
    }
  }

  increase(id, price, index) {
    let i = this.orderItems.findIndex((item) => {
      return item.id == id;
    });
    this.tempMenuCards[index].customize++;
    let item = { ...this.orderItems[i].data[0] };
    item.qty++;
    item.price += price;
    this.orderItems[i].data[0] = item;
    this.orderService.setOrderItems(
      JSON.parse(JSON.stringify(this.orderItems))
    );
  }

  decrease(id, price, index) {
    let i = this.orderItems.findIndex((item) => {
      return item.id == id;
    });
    this.tempMenuCards[index].customize--;
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

  removeOrderItem(id, cat, index) {
    this.orderItems = this.orderService.removeOrderItem(cat, id);
    this.tempMenuCards[index].customize = 0;
  }

  menuOptionMenu: any;
  async openOptions(menu, index, type) {
    this.menuOptionMenu = menu;
    if (menu.disPrice) {
      this.menuOptionMenu.price = menu.disPrice;
    }
    if (menu.addon?.length == 0 && menu.variant?.length == 0) {
      this.tempMenuCards[index].customize++;
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
    if (type == "customize") {
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
      cssClass: "food-options-container",
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
      console.log(order.data);
      if (order.data.length != 0) {
        if (type == "customize") {
          orderitems[tempIndex].data = order.data;
          this.orderItems = orderitems;
          this.tempMenuCards[index].customize = order.data.length;
        } else {
          this.orderItems.push({
            category: menu.category,
            id: menu.id,
            data: order.data,
            customize: true,
          });
          console.log(this.orderItems);
          this.tempMenuCards[index].customize = order.data.length;
        }
        this.orderService.setOrderItems(
          JSON.parse(JSON.stringify(this.orderItems))
        );
      } else {
        if (type == "customize") {
          orderitems.splice(tempIndex, 1);
          this.orderItems = orderitems;
        }
        this.tempMenuCards[index].customize = 0;
      }
    });
  }
}