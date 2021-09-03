import {
  AfterContentChecked,
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  ToastController,
  ViewWillEnter,
  ViewWillLeave,
} from '@ionic/angular';
import { NgxSpinner, NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { DbService } from 'src/app/services/db.service';
import { OrderService } from 'src/app/services/order.service';

@Component({
  selector: 'app-table',
  templateUrl: './table.page.html',
  styleUrls: ['./table.page.scss'],
})
export class TablePage implements ViewWillEnter, OnDestroy {
  constructor(
    private auth: AuthService,
    private orderService: OrderService,
    private router: Router,
    private dbService: DbService,
    private toast: ToastController,
    private altCtrl: AlertController,
    private spinner: NgxSpinnerService
  ) {}

  tableArray = [];
  selectedTable;
  customers: any = [];
  total_occupied = 0;
  total_checkout = 0;
  total_tables = 0;
  loading = false;
  currentCustomers = [];
  currentTables = 0;
  restType: any[] = [];
  currentRestType;

  tableSub: Subscription;
  custSub: Subscription;

  async ionViewWillEnter() {
    let table = localStorage.getItem('selectedTable');
    if (table) {
      this.selectedTable = table;
    }
    this.dbService.getCustomers();

    this.custSub = this.dbService.seatCustomersSub.subscribe((res: any) => {
      if (table && Number(table) > res) {
        localStorage.removeItem('selectedTable');
        this.selectedTable = '';
      }
      this.customers = res[0];
      this.total_tables = res[1];
      this.restType = res[2];
      let type = localStorage.getItem('type');
      if (type) {
        this.currentRestType = type;
        if (this.restType && this.restType.length >= 2) {
          let type = localStorage.getItem('type');
          if (!type) {
            type = this.restType[0].value;
            localStorage.setItem('type', this.restType[0].value);
          }
          this.currentCustomers = this.customers.filter((e) => e.type == type);
          let index = this.restType
            .map((e) => {
              return e.value;
            })
            .indexOf(type);
          if (index != -1) {
            this.currentTables = Number(this.restType[index].tables);
          }
        } 
      }else {
        localStorage.removeItem('type');
        this.currentTables = this.total_tables;
        this.currentCustomers = this.customers;
      }
      this.setTable();
    });
  }

  setTable() {
    console.log('cust in settable', this.customers, this.total_tables);
    this.tableArray = [];
    this.total_occupied = 0;
    this.total_checkout = 0;
    for (let i = 0; i < this.currentTables; i++) {
      this.tableArray.push({
        cname: '',
        table_no: i + 1,
        checkout: false,
        cid: '',
      });
    }

    for (let ele of this.currentCustomers) {
      if (ele.restore) {
        continue;
      }
      this.tableArray[ele.table - 1].cname = ele.cname;
      this.tableArray[ele.table - 1].checkout = ele.checkout;
      this.tableArray[ele.table - 1].cid = ele.cid;
      this.tableArray[ele.table - 1].inv_id = ele.inv_id || '';
      this.tableArray[ele.table - 1].inv_no = ele.inv_no || '';
    }

    for (let i = 0; i < this.customers.length; i++) {
      if (this.customers[i].cname != '') {
        if (this.customers[i].checkout) {
          this.total_checkout++;
        } else {
          this.total_occupied++;
        }
      }
    }

    console.log(this.tableArray);
  }

  async selectTable(table) {
    if (table.cname == '') {
      const alert = await this.altCtrl.create({
        cssClass: 'alert-class',
        header: 'Confirm',
        inputs: [
          {
            placeholder: 'Enter Customer Name',
            type: 'text',
          },
        ],

        message: 'Add customer to the table',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: 'secondary',
            handler: (blah) => {
              console.log('Confirm Cancel: blah');
            },
          },
          {
            text: 'Continue',
            handler: (ele) => {
              if (!ele[0]) {
                return;
              }
              console.log(ele);
              this.showLoader();
              this.auth
                .verifySession({
                  cname: ele[0],
                  table: table.table_no.toString(),
                })
                .subscribe(
                  (res: any) => {
                    this.hideLoader();
                    console.log(res);
                    if (res.success) {
                      localStorage.setItem('selectedTable', table.table_no);
                      this.router.navigate([`/tabs/menu`]);
                    }
                  },
                  async (err) => {
                    console.log(err);
                    this.hideLoader();
                    if (err.status == 401) {
                      console.log(err.error.message);
                      this.router.navigate([`/not-found/${err.error.message}`]);
                    }
                    let toast = await this.toast.create({
                      message: err.error.message,
                      duration: 4000,
                      position: 'top',
                    });
                    await toast.present();
                  }
                );
            },
          },
        ],
      });
      await alert.present();
    } else if (table.checkout) {
      let toast = await this.toast.create({
        message: 'You can select this table after payment',
        duration: 4000,
        position: 'top',
      });
      await toast.present();
      return;
    } else {
      localStorage.setItem('selectedTable', table.table_no);
      this.router.navigate(['/tabs/menu']);
      this.selectedTable = table;
    }
  }

  ngOnDestroy() {
    this.custSub.unsubscribe();
    this.tableSub.unsubscribe();
  }

  hideLoader() {
    this.orderService.hideTabs.next('unabled');
    this.loading = false;
    this.spinner.hide();
  }
  showLoader() {
    this.loading = true;
    setTimeout(() => {
      this.orderService.hideTabs.next('disabled');
      if (this.loading) {
        this.spinner.show();
      }
    }, 300);
  }
}
