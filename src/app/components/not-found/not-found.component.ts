import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";


@Component({
  selector: "app-not-found",
  templateUrl: "./not-found.component.html",
  styleUrls: ["./not-found.component.scss"],
})
export class NotFoundComponent implements OnInit {
  constructor(private router: Router, private route: ActivatedRoute) {}
  agent;
  message = '';

  ngOnInit() {
    this.agent = navigator.userAgent;
   
    this.route.params.subscribe((param)=>{
      if(param.message){
        this.message = param.message
      }
    })
  }
  viewMenu() {
    this.router.navigate(["/view-menu"]);
  }
}
