import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { Observable, Subject } from "rxjs";
import { map } from "rxjs/operators";
import * as crypto from "crypto-js";
import { environment } from "src/environments/environment";
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: "root",
})
export class OrderService {
  constructor(
    private Firestore: AngularFirestore
  ) {}

  orderItems: any = [];
  finalOrder: any = [];
  finalInvoice: any;
  orderFromFirestore:any = [];
  token = "";
  isModelOpen: boolean = false;
  selectedTable

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
 
  getOrderItems() {
    if (this.orderItems.length) {
      console.log("order items in service........", this.orderItems);
      return JSON.parse(JSON.stringify(this.orderItems));
    }
    let items = localStorage.getItem("orders");
    if (items) {
      let item = JSON.parse(items);
      this.orderItems = [...item];
      return this.orderItems;
    }
    return [];
  }

  async sendOrderToCart() {
    let order: any[] = JSON.parse(JSON.stringify(this.orderItems));
    console.log('send order to cart',order)
    let newOrderItems = [];
    let orderItems: any[];
    if (!order.length) {
      let items: any = localStorage.getItem("orders");
      if (items) {
        order = JSON.parse(items);
        this.orderItems = JSON.parse(JSON.stringify(order));
      }
    }
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
    console.log("set in locallllllll", this.orderItems);
    localStorage.setItem("orders", JSON.stringify(this.orderItems));
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

  setFinalOrder(res) {
    this.orderItems = [];
    this.finalOrder = [];
    this.finalInvoice = {};
    res = JSON.parse(JSON.stringify(res));
    for (let ele of res.order) {
      if (ele.restore || ele.cancel) {
        continue;
      }
      let data = ele.data.filter((e) => !e.restore);
      ele.data = data;
      this.setFinalInvoice(ele);
    }
    if (res.unique) {
      this.finalInvoice.unique = true;
    }

    localStorage.setItem("final_invoice", JSON.stringify(this.finalInvoice));

  }

  /*setFinalOrder(order) {
    this.orderItems = [];
    this.finalOrder.push(order);
    this.setFinalInvoice(order);
  }*/

  getFinalOrder() {
    return JSON.parse(JSON.stringify(this.finalOrder));
  }

  setFinalInvoice(order) {
    if (this.finalInvoice.data) {
      this.finalInvoice.taxable += order.taxable;
      this.finalInvoice.qty += order.qty;
      let index = this.finalInvoice.data.length;
      for (let i = 0; i < order.data.length; i++) {
        let flag = true;
        for (let j = 0; j < index; j++) {
          if (
            order.data[i].name == this.finalInvoice.data[j].name &&
            order.data[i].type == this.finalInvoice.data[j].type &&
            order.data[i].addon.length == this.finalInvoice.data[j].addon.length
          ) {
            let check = order.data[i].addon.every(
              (el) => this.finalInvoice.data[j].addon.indexOf(el) >= 0
            );
            if (check == true) {
              this.finalInvoice.data[j].qty += order.data[i].qty;
              this.finalInvoice.data[j].price += order.data[i].price;
              flag = false;
              break;
            }
          }
        }
        if (flag) {
          this.finalInvoice.data.push(order.data[i]);
        }
      }
    } else {
      delete order.id;
      delete order.inst;
      this.finalInvoice = JSON.parse(JSON.stringify(order));
    }
  }

  getFinalInvoice() {
    return this.finalInvoice;
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
