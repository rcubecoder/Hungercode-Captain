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

          let table = localStorage.getItem('selectedTable');

          if(table){
            let valid = false
            for(let cust of this.seatCustomers){
              if(cust.table == table){
                valid = true
                break
              }
              if(!valid){
                localStorage.removeItem('selectedTable');
              }
            }
          }
        }
        this.seatCustomersSub.next(this.seatCustomers)
        if(this.seatCustomers.length == 0){
          localStorage.removeItem('selectedTable')
        }
       
      },err=>{
        if(err.status == 401){
          localStorage.removeItem('auth_token')
          this.router.navigate(['/login'])
        }
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
