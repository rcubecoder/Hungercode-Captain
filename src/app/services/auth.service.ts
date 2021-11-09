import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient, private router: Router) {}

  url = environment.API.url;
  user: any;
  userSub = new Subject();
  login(data) {
    return this.http.post<any>(this.url + 'auth/login', data);
  }

  getUser() {
    if (!this.user) {
      this.http.get<any>(this.url + 'auth/user').subscribe((res: any) => {
        if (res.success) {
          this.user = res.data;
          this.userSub.next(this.user);
        }
      });
    } else {
      this.userSub.next(this.user);
    }
  }

  isLoggedIn() {
    return !!localStorage.getItem('hungercodes_auth_token');
  }

  forgotPassSendCode(data) {
    return this.http.put(this.url + 'auth/forgot-password', data);
  }

  checkVerificationCodeForgotPass(data) {
    return this.http.put(
      this.url + 'auth/forgot-password/verification-code',
      data
    );
  }

  changePassword(data) {
    return this.http.put(this.url + 'auth/change-password', data);
  }

  verifySession(data) {
    let type = localStorage.getItem('type');
    if (type) {
      data.type = type;
    }
    return this.http.post(this.url + 'auth/verify-session', data);
  }

  
  verifyMobileNo(data) {
    return this.http.post(this.url + 'auth/verify-mobile-no', data);
  }
}
