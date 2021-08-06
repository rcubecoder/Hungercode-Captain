import { Component, OnInit } from "@angular/core";
import {
  NavController,
  AlertController,
  ViewWillEnter,
  ToastController,
} from "@ionic/angular";
import { OrderService } from "src/app/services/order.service";
import { ActivatedRoute, Router } from "@angular/router";
import { DbService } from "src/app/services/db.service";
import { NgxSpinnerService } from "ngx-spinner";
@Component({
  selector: "app-cart",
  templateUrl: "./cart.page.html",
  styleUrls: ["./cart.page.scss"],
})
export class CartPage implements ViewWillEnter {
  constructor(
    private orderService: OrderService,
    private navCtrl: NavController,
    private altCtrl: AlertController,
    private dbService: DbService,
    private router: Router,
    private toast: ToastController,
    private spinner: NgxSpinnerService
  ) {}

  order = [];
  orderItem = [];
  totalPrice: number;
  totalQty: number;
  token = "";
  loading = false;
  selectedTable

  
  async ionViewWillEnter() {
    let table = localStorage.getItem('selectedTable')
    if(table){
      this.selectedTable = table
    }

    let order = await this.orderService.sendOrderToCart();

    this.order = order[0];
    this.orderItem = order[1];
    this.totalPrice = 0;
    this.totalQty = 0;
    for (let item of this.order) {
      this.totalQty += item.qty;
      this.totalPrice += item.price;
    }
    //this.token = await this.orderService.getToken();
  }

  increase(index) {
    let singlePrice = this.order[index].price / this.order[index].qty;
    this.totalQty++;
    this.order[index].qty++;
    this.order[index].price += singlePrice
    this.totalPrice = Math.round(this.totalPrice) + singlePrice;
    let id = this.order[index].id;
    let item = {
      variant: this.order[index].variant,
      name: this.order[index].name,
      price: singlePrice,
      qty: 1,
      addon: this.order[index].addon,
    };
    let i = this.orderItem.findIndex((el) => {
      return el.id == id;
    });
    if (this.orderItem[i].customize == false) {
      this.orderItem[i].data[0].qty++;
      this.orderItem[i].data[0].price += singlePrice
    } else {
      this.orderItem[i].data.push(item);
    }

    this.orderService.setOrderItems(JSON.parse(JSON.stringify(this.orderItem)));
  }

  decrease(index) {
    let singlePrice = this.order[index].price / this.order[index].qty;
    let item = { ...this.order[index] };
    this.order[index].qty--;
    this.order[index].price = Math.round(this.order[index].price) - singlePrice;
    this.totalPrice = Math.round(this.totalPrice) - singlePrice;
    this.totalQty--;
    if (item.qty == 1) {
      this.order.splice(index, 1);
    } else {
      item.qty--;
      item.price = Math.round(item.price) - singlePrice;
    }

    let i = this.orderItem.findIndex((el) => {
      return el.id == item.id;
    });

    if (this.orderItem[i].customize == false) {
      if (this.orderItem[i].data[0].qty == 1) {
        this.orderItem.splice(i, 1);
      } else {
        this.orderItem[i].data[0].qty--;
        this.orderItem[i].data[0].price -= singlePrice
      }
    } else {
      let j = this.orderItem[i].data.findIndex((el) => {
        return (
          el.addon.length == item.addon.length &&
          el.addon.every((el) => item.addon.indexOf(el) >= 0) &&
          el.variant?.name == item.variant?.name &&
          el.variant?.price == item.variant?.price
        );
      });
      if (this.orderItem[i].data.length == 1) {
        this.orderItem.splice(i, 1);
      } else {
        this.orderItem[i].data.splice(j, 1);
      }
    }

    this.orderService.setOrderItems(JSON.parse(JSON.stringify(this.orderItem)));
  }

  deleteItem(index, item) {
    this.totalPrice = this.totalPrice - item.price;
    this.totalQty = this.totalQty - item.qty;
    this.order.splice(index, 1);

    let i = this.orderItem.findIndex((el) => {
      return el.id == item.id;
    });

    if (this.orderItem[i].customize == false) {
      this.orderItem.splice(i, 1);
    } else {
      let j;
      do {
        j = this.orderItem[i].data.findIndex((el) => {
          return (
            el.addon.length == item.addon.length &&
            el.addon.every((el) => item.addon.indexOf(el) >= 0) &&
            el.variant?.name == item.variant?.name &&
            el.variant?.price == item.variant?.price
          );
        });
        if (j != -1) {
          if (this.orderItem[i].data.length == 1) {
            this.orderItem.splice(i, 1);
            j = -1;
          } else {
            this.orderItem[i].data.splice(j, 1);
          }
        }
      } while (j != -1);
    }

    this.orderService.setOrderItems(JSON.parse(JSON.stringify(this.orderItem)));
  }

  async goToStatus() {
    const alert = await this.altCtrl.create({
      cssClass: "alert-class",
      header: "Confirm",
      inputs: [
        {
          placeholder: "Add Cooking Instrucion",
          type: "text",
        },
      ],

      message: "Are you sure ?",
      buttons: [
        {
          text: "Cancel",
          role: "cancel",
          cssClass: "secondary",
          handler: (blah) => {
            console.log("Confirm Cancel: blah");
          },
        },
        {
          text: "Place Order",
          handler: (ele) => {
            console.log(ele);
            let order = JSON.parse(
              JSON.stringify(
                Object.assign(
                  { taxable: this.totalPrice, qty: this.totalQty, inst: ele[0] || '' },
                  { data: this.order },
                )
              )
            );
            this.showLoader();
            this.orderService.placeOrder(order).subscribe(
              async(res:any) => {
                this.hideLoader();
                if (res.success) {
                  this.orderService.setOrderItems([])
                  let toast = await this.toast.create({
                    message: res.message,
                    duration: 3000,
                    position: "top",
                  });
                  await toast.present();
                  this.router.navigate([`/tabs/table`]);
                }
              },
              async (err) => {
                console.log(err);
                this.hideLoader();
                if (err.status == 401) {
                  console.log(err.error.message)
                  this.router.navigate([`/not-found/${err.error.message}`]);
                }
                let toast = await this.toast.create({
                  message: err.error.message,
                  duration: 3000,
                  position: "top",
                });
                await toast.present();
              }
            );
          },
        },
      ],
    });
    await alert.present();
  }
  hideLoader() {
    this.orderService.hideTabs.next("unabled");
    this.loading = false;
    this.spinner.hide();
  }
  showLoader() {
    this.loading = true;
    setTimeout(() => {
      this.orderService.hideTabs.next("disabled");
      if (this.loading) {
        this.spinner.show();
      }
    }, 300);
  }
}
