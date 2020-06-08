import { Component, OnInit, OnDestroy  } from '@angular/core';
import { DataService } from '../websocket/data.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-maps',
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.css']
})

export class MapsComponent implements OnInit, OnDestroy  {

  stockQuote: number;
  sub: Subscription;

  constructor(private dataService: DataService) { }

  ngOnInit() { 
    this.sub = this.dataService.getQuotes()
        .subscribe(quote => {
          this.stockQuote = quote;
        });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

}
