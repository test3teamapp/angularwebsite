import { Component, OnDestroy, OnInit } from '@angular/core';
import { LocationStrategy, PlatformLocation, Location } from '@angular/common';
import { LegendItem, ChartType } from '../lbd/lbd-chart/lbd-chart.component';
import { Subscription } from "rxjs/Subscription";
import { map, catchError, tap, switchAll } from "rxjs/operators";
import {
  Spyrecord,
  SpyrecordClass,
  Alarmtype,
  TableData,
  GraphData,
  GraphCountPlaces,
  GraphTreeData,
  GraphFofLink,
  ChatMessage
} from "../_services/common";
import {
  HttpService
} from "../_services/httpservice.service"

import { io } from "socket.io-client";
import { ChatService } from '../_services/chat.service';



@Component({
  selector: 'app-home',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  providers: [HttpService],
})
export class ChatComponent implements OnInit, OnDestroy {

  public usernames: string[];
  public messages = [];
  public selectedUserToChat: string;
  public isUserToChatSelected: boolean;
  //---------------------------------

  constructor(
    private chatService: ChatService) {

    this.isUserToChatSelected = false;

    this.messages = new Array<ChatMessage>();

    chatService.getLoggedInUsersFromDB().subscribe(
      (data: any) => {
        // success path
        if (data.RESULT !== 'OK') {
          this.chatService.showNotification(Alarmtype.WARNING, data.RESULT);
          this.usernames = [];
        } else {
          this.usernames = data.users;
        }
      },
      (error) => {
        this.chatService.showNotification(Alarmtype.DANGER, error);
      }, // error path
      () => {
        //console.log("http call finished");
        //console.log("table rows number: " + this.tableData.dataRows.length);
        //console.log("getListOfLastSpyrecordsForAllUsers : error: " + this.error);
      }
    );
  }

  ngOnInit() {

    this.chatService.getNewMessage().subscribe((message: string) => {
      if (message) {
        console.log(message);
        this.messages.push(JSON.parse(message));
      }
    })
  }

  public selectUserToChat(toUser: string) {
    this.isUserToChatSelected = true;
    this.selectedUserToChat = toUser;
  }

  public sendMessage(msg: string) {
    this.chatService.sendMessage(this.selectedUserToChat, msg);
  }

  public whoAmI():string {
    return this.chatService.whoAmI();
  }

  ngOnDestroy() { }

}
