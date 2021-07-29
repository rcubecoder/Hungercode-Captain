import { AfterContentChecked, AfterViewInit, Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { ViewWillEnter, ViewWillLeave } from '@ionic/angular'
import { AuthService } from 'src/app/services/auth.service'
import { OrderService } from 'src/app/services/order.service'

@Component({
  selector: 'app-table',
  templateUrl: './table.page.html',
  styleUrls: ['./table.page.scss'],
})
export class TablePage implements ViewWillEnter {
  constructor(
    private auth: AuthService,
    private orderService: OrderService,
    private router: Router,
  ) {}
  tables = []
  selectedTable

  ionViewWillEnter() {
    let table = localStorage.getItem('selectedTable')
    if (table) {
      this.selectedTable = table
    }
    this.auth.getTables()
    this.auth.tableSub.subscribe((res) => {
      if (table && Number(table) > res) {
        localStorage.setItem('selectedTable', '1')
        this.selectedTable = '1'
      }
      this.tables = []
      for (let i = 0; i < res; i++) {
        this.tables.push({ table: `${i + 1}` })
      }
    })
  }


  selectTable(table) {
    localStorage.setItem('selectedTable', table)
    this.router.navigate(['/tabs/menu'])
    this.selectedTable = table
  }
}
