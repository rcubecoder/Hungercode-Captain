import { Injectable } from "@angular/core";
import * as crypto from "crypto-js";
import { environment } from "src/environments/environment";
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient } from "@angular/common/http";
import { Subject } from "rxjs";


@Injectable({
  providedIn: "root",
})
export class OrderService {
  constructor(
    private http: HttpClient,
  ) {}

  orderItems: any = [];
  token = "";
  isModelOpen: boolean = false;
  selectedTable
  url = environment.API.url;
  hideTabs = new Subject();

  getModelStatus() {
    return this.isModelOpen;
  }

  setModelStatus(status) {
    this.isModelOpen = status;
  }

  getSelectedTable(){
    return this.selectedTable
  }

  setSelectedTable(table){
   this.selectedTable = table
  }

  placeOrder(order){
    let table_no = localStorage.getItem('selectedTable')
    return this.http.post(this.url+'order/add-order/'+table_no, order)
  }
 
  getOrderItems() {
    if (this.orderItems.length) {
      console.log("order items in service........", this.orderItems);
      return JSON.parse(JSON.stringify(this.orderItems));
    }
    return [];
  }

  async sendOrderToCart() {
    let order: any[] = JSON.parse(JSON.stringify(this.orderItems));
    console.log('send order to cart',order)
    let newOrderItems = [];
    let orderItems: any[];

    await order.map((item) => {
      let include: any = "";
      for (let i = 0; i < item.data.length; i++) {
        if (include.includes(` ${i} `)) {
          continue;
        }
        for (let j = i + 1; j < item.data.length; j++) {
          if (
            item.data[i].name == item.data[j].name &&
            item.data[i].variant?.name == item.data[j].variant?.name &&
            item.data[i].addon.length == item.data[j].addon.length
          ) {
            let check = item.data[i].addon.every(
              (el) => item.data[j].addon.indexOf(el) >= 0
            );
            if (check == true) {
              include += ` ${j} `;
              item.data[i].qty += item.data[j].qty;
              item.data[i].price += item.data[j].price;
            }
          }
        }
        if (!include.includes(` ${i} `)) {
          newOrderItems.push(
            Object.assign(
              { id: item.id, category: item.category },
              item.data[i]
            )
          );
        }
      }
      console.log("newOrder", newOrderItems);
    });
    return [
      newOrderItems,
      JSON.parse(JSON.stringify(this.orderItems || orderItems)),
    ];
  }

  setOrderItems(items) {
    this.orderItems = items;
  }

  spliceOrderItems(index) {
    this.orderItems.splice(index, 1);
  }

  removeOrderItem(category, id) {
    let orderitems = [...this.orderItems];
    let i = orderitems.findIndex((i) => {
      return i.id == id
    });
    console.log(orderitems, i);
    orderitems.splice(i, 1);
    this.orderItems = orderitems;
    return this.orderItems.slice();
  }

  setToken(token) {
    this.token = token;
  }

  getToken() {
    return encodeURIComponent(this.token);
  }

  async decryptToken(token?): Promise<any> {
    if(!token){
      token =  localStorage.getItem('auth_token')
      console.log(token)
    }
    return new Promise(async (resolve, reject) => {
      const helper=new JwtHelperService();
      try {
          const decoded=helper.decodeToken(token);
          let decrypt=await crypto.AES.decrypt(
            decoded.token,
            environment.enc_secret
          );
          let decryptData=await JSON.parse(decrypt.toString(crypto.enc.Utf8));

        resolve(decryptData);
      } catch (e) {
        console.log("error", e);
        resolve(false);
      }
    });
  }
}
