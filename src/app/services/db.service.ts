import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { environment } from 'src/environments/environment';
import { Observable, Subject } from 'rxjs';
import { OrderService } from './order.service';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
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
  tables: number;
  subsMenu = new Subject();
  orderSubs = new Subject();
  seatCustomers: any = [];
  seatCustomersSub = new Subject();
  restType: any[] = [];

  async getMenuFromFirestore(id): Promise<any> {
    return new Promise(async (resolve, reject) => {
      if (this.menu.length != 0 && id == this.resId) {
        return resolve(true);
      }
      this.categories = [];
      this.menu = [];
      this.resId = id;

      await this.Firestore.collection(`restaurants/${id}/menu`)
        .doc('menu')
        .snapshotChanges()
        .subscribe((res: any) => {
          let menu = res.data().menu || [];
          this.categories = res.data().cat || [];
          this.searchMenu = [];
          this.menu = [];
          this.categories = this.categories.filter((e) => {
            return e.name != 'Special';
          });
          menu?.map((a) => {
            let data = a;
            this.searchMenu.push(a);

            if (this.menu[`${data.category}`]) {
              this.menu[`${data.category}`].push(data);
            } else {
              this.menu[`${data.category}`] = [];
              this.menu[`${data.category}`].push(data);
            }
            if (data.special) {
              if (this.menu['Special']) {
                this.menu['Special'].push(data);
              } else {
                this.menu['Special'] = [];
                this.categories.splice(0, 0, { name: 'Special' });
                this.menu['Special'].push(data);
              }
            }
          });
          resolve(true);
        });
    });
  }

  getMenuFromDb() {
    return this.http.get(this.url + 'menu');
  }

  getMenu(cat) {
    this.category = cat;
    let menu = this.menu[`${cat}`]
      ? JSON.parse(JSON.stringify(this.menu[`${cat}`]))
      : [];
    let type = localStorage.getItem('type');

    if (type) {
      for (let m of menu) {
        m.variant = m.type[type].variant;
        if (m.discount) {
          m.disPrice = m.type[type].disPrice;
        } else {
          m.price = m.type[type].price;
        }
      }
    }
    return menu;
  }

  getAllMenu() {
    let type = localStorage.getItem('type');
    let menu = this.searchMenu
      ? JSON.parse(JSON.stringify(this.searchMenu))
      : [];
    if (type) {
      for (let m of menu) {
        m.variant = m.type[type].variant;
        if (m.discount) {
          m.disPrice = m.type[type].disPrice;
        } else {
          m.price = m.type[type].price;
        }
      }
    }
    return menu;
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

  setMenu(menu) {
    this.searchMenu = JSON.parse(JSON.stringify(menu));
  }

  async getCustomers() {
    if (this.seatCustomers.length == 0) {
      if (!this.resId) {
        let token = await this.orderService.decryptToken();
        this.resId = token.rest_id;
      }
      this.Firestore.collection(`restaurants/${this.resId}/customers`)
        .valueChanges()
        .subscribe(
          (res: any) => {
            console.log(res);
            let restType = [];
            if (res[0]) {
              this.seatCustomers = res[0]?.seat || [];

              if (this.seatCustomers) {
                this.seatCustomers = this.seatCustomers.filter(
                  (e) => !e.restore
                );
              }

              restType = res[0].type || [];
              this.tables = 0;
              if (restType.length > 0) {
                if (restType.length >= 2) {
                  let type = localStorage.getItem('type');
                  if (!type) {
                    localStorage.setItem('type', restType[0].value);
                  }
                  this.restType = restType;
                }
                for (let t of restType) {
                  this.tables += Number(t.tables);
                }
              } else {
                this.restType = [];
                this.tables = Number(res[0].tables);
              }

              let table = localStorage.getItem('selectedTable');

              if (table) {
                let valid = false;
                for (let cust of this.seatCustomers) {
                  if (cust.table == table) {
                    valid = true;
                    break;
                  }
                  if (!valid) {
                    localStorage.removeItem('selectedTable');
                  }
                }
              }
            }
            this.seatCustomersSub.next([
              JSON.parse(JSON.stringify(this.seatCustomers)),
              this.tables,
              this.restType || [],
            ]);
            if (this.seatCustomers.length == 0) {
              localStorage.removeItem('selectedTable');
            }
          },
          (err) => {
            if (err.status == 401) {
              localStorage.removeItem('auth_token');
              this.router.navigate(['/login']);
            }
          }
        );
    } else {
      this.seatCustomersSub.next([
        JSON.parse(JSON.stringify(this.seatCustomers)),
        this.tables,
        this.restType || [],
      ]);
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
