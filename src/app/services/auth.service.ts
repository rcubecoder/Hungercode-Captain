import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}

  url = environment.API.url;
  user: any;
  tables;
  tableSub = new Subject();
  userSub = new Subject();
  login(data) {
    return this.http.post<any>(this.url + 'auth/login', data);
  }

  getUser() {
    if(!this.user){
      this.http.get<any>(this.url + 'auth/user').subscribe((res:any) => {
        if(res.success){
          this.user = res.data;
          this.userSub.next(this.user)
        }
      })
    }else{
      this.userSub.next(this.user)
    }
    
  }

  getTables(){
    if(!this.tables){
      this.http.get<any>(this.url+'auth/tables').subscribe((res)=>{
        if(res.success){
          this.tables = Number(res.data.tables)
          this.tableSub.next(this.tables)
        }
      })
    }else{
      this.tableSub.next(this.tables)
    }
  }

  isLoggedIn() {
    return !!localStorage.getItem('firestep_auth_token');
  }
  
  forgotPassSendCode(data) {
    return this.http.put(this.url + 'auth/forgot-password', data)
  }

  
  checkVerificationCodeForgotPass(data) {
    return this.http.put(
      this.url + 'auth/forgot-password/verification-code',
      data,
    )
  }

  changePassword(data) {
    return this.http.put(this.url + 'auth/change-password', data)
  }
}
