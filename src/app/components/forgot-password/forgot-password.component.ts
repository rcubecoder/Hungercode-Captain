import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { ToastController, ViewWillEnter } from '@ionic/angular'
import { AuthService } from 'src/app/services/auth.service'

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent implements ViewWillEnter {
  constructor(private router: Router, private authService: AuthService, private tostCtrl: ToastController) {}

  ionViewWillEnter() {
    let token = localStorage.getItem('auth_token')
    if (token) {
      this.router.navigate(['/token/'])
    }
  }
  model: any = {}
  isVerificationCode = false
  verificationCode = ''
  isNewPassword
  new_password
  re_password
  loading = false
  show = false
  hideEyeIcon = true
  show_2 = false
  hideEyeIcon_2 = true

  onSubmit() {
    this.authService.forgotPassSendCode(this.model).subscribe(
      async(res: any) => {
        console.log(res)
        if (res.success) {
          this.isVerificationCode = true
          let model = await this.tostCtrl.create({
            message: res.message,
            duration: 4000,
            position: "top",
          })
  
          await model.present();
        }
      },
      async(err:any) => {
        let model = await this.tostCtrl.create({
          message: err.error.message,
          duration: 4000,
          position: "top",
        })

        await model.present();
      },
    )
  }

  changeType() {
    this.hideEyeIcon = !this.hideEyeIcon
  }

  changeType_2() {
    this.hideEyeIcon_2 = !this.hideEyeIcon_2
  }
  checkVerificationCode() {
    this.authService
      .checkVerificationCodeForgotPass({
        code: this.verificationCode,
        email: this.model.email,
      })
      .subscribe(
        async(res: any) => {
          if (res.success) {
            this.isNewPassword = true
            let model = await this.tostCtrl.create({
              message: res.message,
              duration: 4000,
              position: "top",
            })
    
            await model.present();
          }
        },
        async(err:any) => {
          let model = await this.tostCtrl.create({
            message: err.error.message,
            duration: 4000,
            position: "top",
          })
  
          await model.present();
        },
      )
  }

  changePassword() {
    this.authService
      .changePassword({
        new_pass: this.model.new_password,
        confirm_pass: this.model.re_password,
        email: this.model.email,
        code: this.verificationCode,
      })
      .subscribe(
       async (res: any) => {
          if (res.success) {
            let model = await this.tostCtrl.create({
              message: res.message,
              duration: 4000,
              position: "top",
            })
            await model.present();
            this.router.navigate(['/login'])
          }
        },
        async(err:any) => {
          let model = await this.tostCtrl.create({
            message: err.error.message,
            duration: 4000,
            position: "top",
          })
  
          await model.present();
        },
      )
  }
}
