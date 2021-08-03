import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ViewWillEnter } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';


@Component({
  selector: 'app-setting',
  templateUrl: './setting.page.html',
  styleUrls: ['./setting.page.scss'],
})
export class SettingPage implements ViewWillEnter, OnDestroy {

  constructor(private authService:AuthService, private router:Router,  private altCtrl: AlertController,) {
     
   
  }
  user :any;
 subscription: Subscription
  ionViewWillEnter(){
   this.authService.getUser();
   this.subscription = this.authService.userSub.subscribe(res=>{
     this.user = res
   })
   
  }

  async logout() {

    const alert = await this.altCtrl.create({
      cssClass: "alert-class",
      header: "Logout",
      message: "Are you sure ?",
      buttons: [
        {
          text: "No",
          role: "cancel",
          cssClass: "secondary",
          handler: (blah) => {
            console.log("Confirm Cancel: blah");
          },
        },
        {
          text: "Yes",
          handler: (ele) => {
            localStorage.removeItem("auth_token");
            this.router.navigate(["/login"]);
            console.log(ele);
            
                
              }
    }]
         
      
    
    });
    await alert.present();



  }

  ngOnDestroy(){
    this.subscription.unsubscribe();
  }
}
