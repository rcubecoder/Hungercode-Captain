import { Injectable, OnInit } from "@angular/core";
import { OrderService } from "./order.service";
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  ActivatedRoute,
} from "@angular/router";
import { Observable } from "rxjs";
import { DbService } from "./db.service";
import { ToastController } from "@ionic/angular";


@Injectable({
  providedIn: "root",
})
export class AuthguardService implements OnInit, CanActivate {
  constructor(
    private orderService: OrderService,
    private dbService: DbService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastController
  ) {}

  ngOnInit() {
    console.log("call auth");
  }

  async canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {

    let selectedTable =  localStorage.getItem('selectedTable')
    if(!selectedTable){
      let toast = await this.toast.create({
        message: 'Please select table first',
        duration: 3000,
        position: "top",
      });
      await toast.present();
      this.router.navigate(["/tabs/table"]);
      return false;
    }

    let payload: any = await this.orderService.decryptToken();
    console.log(payload)
    let isMobile =
      true; /* /Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(
      navigator.userAgent
    );*/

    if (payload.rest_id && isMobile) {
      return new Promise(async (resolve, reject) => {
        let response = await this.dbService.getMenuFromFirestore(
          payload.rest_id
        );
        if (response) {
          resolve(true);
        } else {
          this.router.navigate(["/not-found/Scan QR code properly"]);
          resolve(false);
        }
      });
    } else {
      this.router.navigate(["/not-found/Scan QR code properly"]);
      return false;
    }
  }
}
