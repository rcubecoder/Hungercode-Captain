import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { environment } from "src/environments/environment";
import { Observable, Subject } from "rxjs";
import { OrderService } from "./order.service";
import { Router } from "@angular/router";
import { AuthService } from "./auth.service";
import { ToastController } from "@ionic/angular";

@Injectable({
  providedIn: "root",
})
export class DbService {
  constructor(
    private Firestore: AngularFirestore,
    private http: HttpClient,
    private router: Router,
    private orderService: OrderService,
    private authService: AuthService,
    private toast: ToastController
  ) {}

  url = environment.API.url;
  categories: any = [];
  menu: any = [];
  searchMenu: any = [];
  order: any = [];
  category: string;
  resId: string;
  table: number;
  subsMenu = new Subject();
  orderSubs = new Subject();
  seatCustomers:any = [];
  seatCustomersSub = new Subject();

  async getMenuFromFirestore(id): Promise<any> {
    return new Promise(async (resolve, reject) => {
      if (this.menu.length != 0 && id == this.resId) {
        return resolve(true);
      }
      this.categories = [];
      this.menu = [];
      this.resId = id;
      await this.Firestore.collection("restaurants")
        .doc(id)
        .collection("categories")
        .snapshotChanges()
        .subscribe(async (res: any) => {
          res.map((a) => {
            this.categories = a.payload.doc.data().cat;
          });
          await this.Firestore.collection(`restaurants/${id}/menu`)
            .doc("menu")
            .snapshotChanges()
            .subscribe((res: any) => {
              console.log(typeof res, res);
              res = res.payload.data();
              let subs: any = {};
              let menu: any = { ...this.menu };
              this.searchMenu = [];
              this.menu = [];
              this.categories = this.categories.filter((e) => {
                return e.name != "Special";
              });
              res?.menu?.map((a) => {
                let data = a;

                this.searchMenu.push(a);

                let item = menu[`${data.category}`]?.find(
                  (ele) => ele.id == data.id
                );

                if (item) {
                  if (item.customize != data.customize) {
                    subs = {
                      category: data.category,
                      name: data.name,
                      id: data.id,
                      customize: data.customize,
                    };
                  }
                }

                if (this.menu[`${data.category}`]) {
                  this.menu[`${data.category}`].push(data);
                } else {
                  this.menu[`${data.category}`] = [];
                  this.menu[`${data.category}`].push(data);
                }
                if (data.special) {
                  if (this.menu["Special"]) {
                    this.menu["Special"].push(data);
                  } else {
                    this.menu["Special"] = [];
                    this.categories.splice(0, 0, { name: "Special" });
                    this.menu["Special"].push(data);
                  }
                }
              });

              if (subs && subs.id) {
                this.subsMenu.next(subs);
              }
              resolve(true);
            });
        });
    });
  }

  getMenuFromFirestoreByRestId(id) {
    console.log(id);
    return this.Firestore.collection(`restaurants/${id}/menu`)
      .doc("menu")
      .get();
  }

  getMenu(cat) {
    this.category = cat;
    return JSON.parse(JSON.stringify(this.menu[`${cat}`] || []));
  }

  getCategory() {
    return this.category;
  }

  setCategory(cat) {
    this.category = cat;
  }

  getCategories() {
    return this.categories.slice();
  }

  placeOrder(order) {
    return this.http.post<any>(this.url + "order/place-order", order);
  }

  getOrder(data) {
    let order, doc;
    if (data.table == "takeaway") {
      doc = `${data.cid}`;
      order = "torder";
    } else {
      doc = `table-${data.table}`;
      order = "order";
    }
    return this.Firestore.collection(`restaurants`)
      .doc(data.rest_id)
      .collection(order)
      .doc(doc)
      .valueChanges()
      .subscribe(async (res) => {
        if (res) {
          if (!res.restore) {
            let message = "";
            res.order.map((ele, i) => {
              if (ele.restore) {
                if (this.order[i] && !this.order[i].restore) {
                  message = `You order-${
                    i + 1
                  } has been canceled by restaurant!`;
                }
              }

              if (!ele.restore) {
                if (this.order[i] && this.order[i].restore) {
                  message = `You order-${
                    i + 1
                  } has been restored by restaurant!`;
                }
              }
            });

            if (message) {
              let toast = await this.toast.create({
                message: message,
                duration: 3000,
                position: "top",
              });
              await toast.present();
            }

            this.order = res.order;
            this.setDatabaseOrder(res.order);
            this.orderSubs.next(res.order);
            this.orderService.setFinalOrder(res);
          }
        }
      });
  }

  setDatabaseOrder(order) {
    this.order = JSON.parse(JSON.stringify(order));
  }

  getDataBaseOrder() {
    return JSON.parse(JSON.stringify(this.order));
  }

  checkout(data) {
    return this.http.post(this.url + "order/checkout", data);
  }



  async getCustomers() {
    if(this.seatCustomers.length == 0){
    if (!this.resId) {
    let token =  await this.orderService.decryptToken();
    this.resId = token.rest_id;
    }
    this.Firestore
      .collection(`restaurants/${this.resId}/customers`)
      .valueChanges()
      .subscribe((res: any) => {
        console.log(res)
        if (res[0]) {
          this.seatCustomers=res[0]?.seat||[]
        }
        this.seatCustomersSub.next(res[0]?.seat||[])
      });
    }else{
      this.seatCustomersSub.next(this.seatCustomers)
    }
  }

  /*   addMenu() {
     let menu = new Menu().getMenu('Thai');
     for(let m of menu){
     this.Firestore.collection('Beverages')
       .doc('AlF2j3zoh5KKUyIowNcf')
       .collection('menu')
       .add(m);
     }
   }
 
   addCat(){
     this.Firestore.collection('restaurants')
     .doc('AlF2j3zoh5KKUyIowNcf')
     .collection('categories')
     .add({cat:this.cat});
   }  */
}
