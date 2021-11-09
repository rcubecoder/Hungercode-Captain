import { AfterViewInit, Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

import { DbService } from 'src/app/services/db.service';
import { ToastController } from '@ionic/angular';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements AfterViewInit {
  hideEyeIcon = true;
  hide = true;
  rem = false;
  login: string;


  constructor(
    private auth: AuthService,
    private router: Router,

    private dbService: DbService,
    private toastController: ToastController,
    private spinner: NgxSpinnerService
  ) {}

  loading = false;
  ngAfterViewInit() {
    let token = localStorage.getItem('auth_token');

    if (token) {
      this.router.navigate([`/tabs/table`]);
    }

    let height = window.innerHeight;
    let footer = document.getElementById('footer');
    window.addEventListener('resize', () => {
      if (window.innerHeight < height) {
        footer.style.marginBottom = '-50px';
      } else {
        footer.style.marginBottom = '0px';
      }
    });
  }

  changeType() {
    console.log('change');
    this.hideEyeIcon = !this.hideEyeIcon;
  }

  viewMenu() {
    this.router.navigate(['/view-menu']);
  }

  async onSubmit(form: NgForm) {
    let details = {
      email: form.value.email,
      password: form.value.pass,
    };
    this.loginReqset(details);
  }

  loginReqset(details) {
    this.showLoader();
    this.auth.login(details).subscribe(
      (res) => {
        this.hideLoader();
        if (res.success) {
          localStorage.setItem('auth_token', res.token);
          this.router.navigate([`/tabs/table`]);
        }
      },
      async (err) => {
        this.hideLoader();
        let toast = await this.toastController.create({
          message: err.error.message,
          duration: 4000,
          position: 'top',
        });
        await toast.present();
      }
    );
  }
  hideLoader() {
    this.loading = false;
    this.spinner.hide();
  }

  showLoader() {
    this.loading = true;
    setTimeout(() => {
      if (this.loading) {
        this.spinner.show();
      }
    }, 300);
  }
}
