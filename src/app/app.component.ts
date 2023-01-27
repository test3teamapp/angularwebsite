import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { LocationStrategy, PlatformLocation, Location } from '@angular/common';
import { AccountService } from './_services/account.service';
import { Observable, Subject } from 'rxjs';
import { User } from './_models/user';
import { ChatService } from './_services/chat.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnChanges {


  constructor(
    public location: Location,
    private accountService: AccountService,
    private chatService: ChatService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    
  }

  ngOnInit() {
  
  }

  isPage(path) {
    var title = this.location.prepareExternalUrl(this.location.path());
    title = title.slice(2);
    if (path === title) {
      return true;
    }
    else {
      return false;
    }
  }
}
