import {
  Component,
  OnInit,
  ViewChild,
  Input,
  ChangeDetectionStrategy,
} from "@angular/core";
import { ModalController, IonSlides } from "@ionic/angular";
import { OrderService } from "src/app/services/order.service";

@Component({
  selector: "app-menuoptions",
  templateUrl: "./menuoptions.component.html",
  styleUrls: ["./menuoptions.component.scss"],
})
export class MenuoptionsComponent implements OnInit {
  constructor(
    public modalController: ModalController,
    private orderService: OrderService
  ) {
    this.orderService.setModelStatus(true);
  }

  @ViewChild("ionslide", { static: true }) slides: IonSlides;
  @Input() modalOptions;
  @Input() selectedItems;

  totalPrice: number = 0;
  variant: any;
  totalItem = 0;
  selecteditems = [];
  list = [];

  index = 0;
  sliderConfig: any;

  ngOnInit() {
    if (this.selectedItems != null) {
      let i = 0;
      this.selecteditems = this.selectedItems;
      for (let item of this.selecteditems) {
        this.totalPrice += item.price;
        this.totalItem++;
        this.list.push(i);
        i++;
      }
      this.index = i - 1;
    } else {
      let item = {
        name: this.modalOptions.name,
        qty: 1,
        price: this.modalOptions.price,
        addon: [],
        variant: this.modalOptions.variant ? this.modalOptions.variant[0] : "",
      };
      this.selecteditems.push(item);
      this.totalItem++;
      this.list.push(this.index);
      this.index++;
      this.totalPrice = this.modalOptions.price;
    }
    this.sliderConfig = {
      slidesPerView: 1,
      spaceBetween: 20,
      centeredSlides: true,
    };
  }

  ngAfterViewInit() {
    let i = 0;
    if (this.selecteditems.length > 0) {
      
      for (let item of this.selecteditems) {
        if (item.variant) {
          document
            .getElementById(`radio${i}`)
            .setAttribute("value", item.variant.name);
        }
        for (let addon of item.addon) {
       
          let index = this.modalOptions.addon.findIndex((i) => i.name == addon);
         
          document
            .getElementById(`addon${i}_${index}`)
            .setAttribute("checked", "true");
        }
        i++;
      }
    } else {
     
      if (this.modalOptions.variant.length > 0) {
        document
          .getElementById(`radio${0}`)
          .setAttribute("value", this.modalOptions.variant[0].name);
        this.variant = this.modalOptions.variant[0];
      }
      this.slides.slideTo(0)
    }
    
    this.sliderConfig = {
      slidesPerView: 1,
      spaceBetween: 20,
      centeredSlides: true,
      initialSlide: i
    };
  }

  trackByMethod(index, el) {
    return el;
  }

  addOldItem(index) {
    let selectedItemsCopy = [...this.selecteditems];
    let item = { ...selectedItemsCopy[index] };
    let price = item.price / item.qty;
    item.qty++;
    item.price += price;
    this.totalPrice += price;
    selectedItemsCopy[index] = item;
    this.selecteditems = selectedItemsCopy;
    this.totalItem++;
  }

  addNewItem() {
    let item = {
      name: this.modalOptions.name,
      qty: 1,
      price: this.modalOptions.price,
      addon: [],
      variant: {},
    };
    this.selecteditems.push(item);
    this.totalItem++;
    this.totalPrice += this.modalOptions.price;
    this.list.push(this.index);
   
    this.index++;
    this.slides.getActiveIndex().then((i) => {
    
      if (this.modalOptions.variant?.length != 0) {
        let id = document.getElementById(`radio${this.list.length - 1}`);
        if (id) {
          id.setAttribute("value", this.modalOptions.variant[0].name);
          item.variant = {
            name: this.modalOptions.variant[0].name,
            price: this.modalOptions.variant[0].price,
          };
        }
      }
      
    });
  }

  changeVariant(variant, index) {
 
    let old_val = document
      .getElementById(`radio${index}`)
      .getAttribute("value");
  
    document
      .getElementById(`radio${index}`)
      .setAttribute("value", variant.name);
    let i = this.modalOptions.variant.findIndex((i) => i.name == old_val);
    let selectedItemsCopy = [...this.selecteditems];
    let item = { ...selectedItemsCopy[index] };
    item.price -= this.modalOptions.variant[i].price * item.qty;
    item.price += variant.price * item.qty;
    item.variant = {
      name: variant.name,
      price: variant.price,
    };
    this.totalPrice -= this.modalOptions.variant[i].price * item.qty;
    this.totalPrice += variant.price * item.qty;
    selectedItemsCopy[index] = item;
    this.selecteditems = selectedItemsCopy;
  }

  addAddon(index, price, name, event) {
    if (!event.target.checked) {
      if (this.selecteditems[index]) {
        let selectedItemsCopy = [...this.selecteditems];
        let item = { ...selectedItemsCopy[index] };
        item.price += price * item.qty;
        this.totalPrice += price * item.qty;
        item.addon.push(name);
        selectedItemsCopy[index] = item;
        this.selecteditems = selectedItemsCopy;
      } else {
        this.totalPrice += price;
      }
    } else {
      if (this.selecteditems[index]) {
        let selectedItemsCopy = [...this.selecteditems];
        let item = { ...selectedItemsCopy[index] };
        item.price -= price * item.qty;
        this.totalPrice -= price * item.qty;
        let i = item.addon.indexOf(name);
        item.addon.splice(i, 1);
        selectedItemsCopy[index] = item;
        this.selecteditems = selectedItemsCopy;
      } else {
        this.totalPrice -= price;
      }
    }
  }

  async removeAllItem() {
    this.selecteditems = [];
    await this.modalController.dismiss(this.selecteditems);
  }

  async removeItem(index) {
    document.getElementById(`slide${index}`).classList.remove("slide-box-add");
    document.getElementById(`slide${index}`).classList.add("slide-box-remove");
    setTimeout(async () => {
      this.totalPrice -= this.selecteditems[index].price;
      this.totalItem -= this.selecteditems[index].qty;
      let tempList = this.list.slice()
      tempList.splice(index, 1);
      this.index--;
      this.list = tempList;
      this.selecteditems.splice(index, 1);
      if (this.selecteditems.length == 0) {
        this.selecteditems = [];
        await this.modalController.dismiss(this.selecteditems);
      }
    }, 500);
  }

  async closeOptions() {
    /* if (this.list.length > this.selecteditems.length) {
      let item = {
        name: this.modalOptions.name,
        qty: 1,
        price: this.modalOptions.price + this.addonPrice,
        addon: this.addon,
        varint: this.variant,
      }
      this.selecteditems.push(item)
    } */
    await this.modalController.dismiss(this.selecteditems.slice());
  }
}
