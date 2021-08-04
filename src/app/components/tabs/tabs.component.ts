import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { OrderService } from 'src/app/services/order.service';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
})
export class TabsComponent implements OnInit {

  constructor(private route:ActivatedRoute, private orderService:OrderService) { }
  
  tabsOn=false;
  ngOnInit() {
    this.orderService.hideTabs.subscribe((res)=>{
      if(res=="disabled"){
        this.tabsOn=true;
      }
      else{
        this.tabsOn=false;
      }
    })
  }

}
