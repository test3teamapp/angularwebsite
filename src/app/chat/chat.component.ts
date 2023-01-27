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

  private previousMessage:string = "";
  private subscriptionToNewMessages:Subscription;
  public usernames: string[];
  public messages = [];
  public selectedUserToChat: string;
  public isUserToChatSelected: boolean;
  //---------------------------------

  constructor(
    private location: Location,
    private chatService: ChatService) {

    this.isUserToChatSelected = false;
  }

  ngOnInit() {

     this.chatService.getLoggedInUsersFromDB().subscribe(
      (data: any) => {
        // success path
        if (data.RESULT !== 'OK') {
          this.chatService.showNotification(Alarmtype.WARNING, data.RESULT, 1);
        } else {
          this.usernames = [];
          this.usernames = this.usernames.concat(data.users);
          // remove any dublicates
          var tempArray = [...new Set(this.usernames)];
          // remove our selves
          tempArray = tempArray.filter((user: string) => user != this.chatService.whoAmI())
          this.usernames = tempArray;
        }
      },
      (error) => {
        this.chatService.showNotification(Alarmtype.DANGER, error, 1);
      }, // error path
      () => {
        //console.log("http call finished");
        //console.log("table rows number: " + this.tableData.dataRows.length);
        //console.log("getListOfLastSpyrecordsForAllUsers : error: " + this.error);
      }
    );

    this.subscriptionToNewMessages = this.chatService.getNewMessage().subscribe((message: string) => {      
      if (message != this.previousMessage){
        this.previousMessage = message;
        //console.log("getNewMessage().subscribe :" + message);
        const msg: ChatMessage = JSON.parse(message);
        
        if (this.chatService.whoAmI() === "") return // we are logged in but socket is still on

        if (msg.to === this.chatService.whoAmI()) { // msg are sent unicast
          this.messages.push(JSON.parse(message));
          this.updateScroll();
        }
        if (this.usernames === undefined) {
          this.usernames = [];
        }
        // handle user events "disconnect" / "connect"
        if (msg.event) {
          if (msg.event.type === "disconnect") {
            if (msg.event.user === this.chatService.whoAmI()){
              this.chatService.disconnectSocket();
            }else {
              // remove from user's list
              this.usernames = this.usernames.filter(user => user != msg.event.user);
              this.chatService.showNotification(Alarmtype.WARNING, msg.message, 1);
            }
          } else if (msg.event.type === "connect") {
            if (msg.event.user != this.chatService.whoAmI()) {
              this.usernames.push(msg.event.user);
              // remove any dublicates
              var tempArray = [...new Set(this.usernames)];
              // remove our selves
              tempArray = tempArray.filter((user: string) => user != this.chatService.whoAmI())
              this.usernames = tempArray;
              this.chatService.showNotification(Alarmtype.INFO, msg.message, 1);
            }
          }
        }
      }
    })
  }

  private updateScroll() {
    //console.log(this.location.path(true));
    // if we are not in the chat page, do not try to update the visual element
    // also if the user has not selected any corespodent, 
    // the div displaying the msg is not presented on the dom element, so
    // use notification instead
    if ((this.location.path(true) === "/chat") && this.isUserToChatSelected){
      var element = document.getElementById("msgsPanel");
      element.scrollTop = element.scrollHeight - element.clientHeight;
    }else {
      // pop notification with the latest msg.
      // since we are not in the chat page to send it, 
      //it can only be one that was sent to us
      const lastMessage:ChatMessage = this.messages[this.messages.length - 1];
      this.chatService.showNotification(Alarmtype.SUCCESS, lastMessage.from  + " says: " + lastMessage.message, 2);
    }
  }

  public selectUserToChat(toUser: string) {
    this.isUserToChatSelected = true;
    this.selectedUserToChat = toUser;
  }

  public sendMessage(msg: string) {
    const tempMsg: ChatMessage = {
      from: this.chatService.whoAmI(),
      to: this.selectedUserToChat,
      message: msg
    }
    this.messages.push(tempMsg); // we added here since the delivery will be unicasting
    this.chatService.sendMessage(this.selectedUserToChat, msg);
    this.updateScroll();
  }

  public whoAmI(): string {
    return this.chatService.whoAmI();
  }

  ngOnDestroy() {
    //console.log("Chat component destroyed");
    this.subscriptionToNewMessages.unsubscribe();
    this.chatService.clearSocketBuffer();
   }

}
