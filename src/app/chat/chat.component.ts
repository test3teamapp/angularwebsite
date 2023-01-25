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
  GraphFofLink
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


  //---------------------------------

  constructor(
    private chatService: ChatService) {

      chatService.getLoggedInUsers();
     }

  ngOnInit() {
  }

  ngOnDestroy() { }

}
