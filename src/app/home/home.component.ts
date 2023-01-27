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
import { ChatService } from 'app/_services/chat.service';



@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [HttpService],
})
export class HomeComponent implements OnInit, OnDestroy {
  error: any;
  private subscriptionToNewMessages:Subscription;
  private previousMessage:string = "";
  // for last meeting graph
  public tableData: TableData;
  public graphData: GraphData;
  public graphFooterTimeText: string;
  public graphSubtitleText: string;
  public meetingGraphLegendItems: LegendItem[];

  // for counting placess of meetings in past month(s)
  public placesGraphData: GraphCountPlaces[];
  public placesChartType: ChartType;
  public placesChartData: any;
  public placesFooterText: string;
  public placesSubtitleText: string;

  // for tree of friends
  public fofGraphTreeData: GraphTreeData;
  public fofGraphTreeFooterText: string;
  public fofGraphTreeSubtitleText: string;

  //---------------------------------

  constructor(private httpService: HttpService, private chatService:ChatService) { }

  getListOfLastSpyrecordsForAllUsers(usersselected: string) {

    this.httpService.getLastSpyrecordsOfUsers(usersselected).subscribe(
      (data: any) => {
        // success path
        let i = 0;
        this.tableData.dataRows = data.map((item) => {
          ////console.log(item);
          i++;
          return new SpyrecordClass(
            i,
            item["locationUpdated"],
            item["name"],
            '{}',
            item["location"]["latitude"],
            item["location"]["longitude"]
          );
        });
      },
      (error) => {
        this.error = error;
        this.httpService.showNotification(Alarmtype.DANGER, error);
      }, // error path
      () => {
        //console.log("http call finished");
        //console.log("table rows number: " + this.tableData.dataRows.length);
        //console.log("getListOfLastSpyrecordsForAllUsers : error: " + this.error);
      }
    );
  }

  getMeetingDataForUser(usersselected: string, hours: number) {

    if (usersselected === null || usersselected === '') {
      this.httpService.showNotification(Alarmtype.WARNING, "Please select a user id");
      return;
    }
    if (hours === null || isNaN(hours)) {
      hours = 24;
    }
    this.httpService.getMeetingDataForUser(usersselected, hours).subscribe(
      (data: any) => {
        // success path
        if (data.ERROR) {
          // not the result we expected
          //console.log(" Response message: " + data.ERROR);
          this.error = data.ERROR;
          //reject(res);
          this.httpService.showNotification(Alarmtype.WARNING, data.ERROR);
        } else {
          if (data.graphResult.data.length == 0) {
            this.httpService.showNotification(Alarmtype.INFO, "NO MEETING IN THE TIME PERIOD SPECIFIED");
          } else {
            let tempGraphData: GraphData;
            tempGraphData = {
              name: usersselected,
              people: [],
              meeting: { id: 0, date: '' },
              place: { id: 0, name: '', lng: 0, lat: 0 }
            };

            data.graphResult.data[0].allp.forEach(p => {
              tempGraphData.people.push({ id: p.id, name: p.properties.name });
            });

            tempGraphData.meeting = { id: data.graphResult.data[0].m.id, date: data.graphResult.data[0].m.properties.stringDate };
            tempGraphData.place = {
              id: data.graphResult.data[0].pl.id,
              name: data.graphResult.data[0].pl.properties.name,
              lng: Number(data.graphResult.data[0].pl.properties.lng),
              lat: Number(data.graphResult.data[0].pl.properties.lat),
            };
            // to trigger the change , that will be caugth by ngOnChange
            // we need a new "assignment"
            this.graphData = tempGraphData;

            this.graphSubtitleText = "latest in " + hours + " hours";
          }
        }
      },
      (error) => {
        this.error = error;
        this.httpService.showNotification(Alarmtype.DANGER, error);
      }, // error path
      () => {
        //console.log("http call for meeting data finished");
        ////console.log("table rows number: " + JSON.stringify(this.graphData));
        //console.log("getMeetingDataForUser : error: " + this.error);
      }
    );
  }

  getPlacesOfMeetingsForUser(usersselected: string, months: number) {

    if (usersselected === null || usersselected === '') {
      this.httpService.showNotification(Alarmtype.WARNING, "Please select a user id");
      return;
    }
    if (months === null || isNaN(months)) {
      months = 1;
    }
    this.httpService.getPlacesOfMeetingsForUser(usersselected, months).subscribe(
      (data: any) => {
        // success path
        if (data.ERROR) {
          // not the result we expected
          //console.log(" Response message: " + data.ERROR);
          this.error = data.ERROR;
          //reject(res);
          this.httpService.showNotification(Alarmtype.WARNING, data.ERROR);
        } else {
          if (data.graphResult.data.length == 0) {
            this.httpService.showNotification(Alarmtype.INFO, "NO MEETINGS IN THE TIME PERIOD SPECIFIED");
          } else {
            var tempGraphData: GraphCountPlaces[];
            tempGraphData = [];
            var tempLabels = [];
            var tempPercentages = [];

            var i = 1;
            data.graphResult.data.forEach(p => {
              tempGraphData.push({
                name: usersselected,
                place: {
                  id: p.place.id,
                  name: p.place.properties.name,
                  lng: Number(p.place.properties.lng),
                  lat: Number(p.place.properties.lat),
                },
                placeCount: p.placeCount
              });
              tempLabels.push(p.place.properties.name);
              tempPercentages.push(Math.round((Number(p.placeCount) / data.graphResult.data.length) * 100));
            });

            // to trigger the change , that will be caugth by ngOnChange
            // we need a new "assignment"
            this.placesGraphData = tempGraphData;
            var tempChartData = {
              labels: tempLabels,
              series: tempPercentages
            };
            this.placesChartData = tempChartData;
            this.placesSubtitleText = "meeting places during past " + months + " month(s)";
          }
        }
      },
      (error) => {
        this.error = error;
        this.httpService.showNotification(Alarmtype.DANGER, error);
      }, // error path
      () => {
        //console.log("http call for places data finished");
        ////console.log("table rows number: " + JSON.stringify(this.graphData));
        //console.log("getPlacesOfMeetingsForUser : error: " + this.error);
      }
    );
  }

  getFriendsOfFriendsGraphTree(usersselected: string) {

    if (usersselected === null || usersselected === '') {
      this.httpService.showNotification(Alarmtype.WARNING, "Please select a user id");
      return;
    }
    this.httpService.getFriendsOfFriendsGraphTree(usersselected).subscribe(
      (data: any) => {
        // success path
        if (data.ERROR) {
          // not the result we expected
          //console.log(" Response message: " + data.ERROR);
          this.error = data.ERROR;
          //reject(res);
          this.httpService.showNotification(Alarmtype.WARNING, data.ERROR);
        } else {
          if (data.graphResult.friends.length == 0) {
            this.httpService.showNotification(Alarmtype.INFO, "NO FRIENDS");
          } else {
            var tempGraphData: GraphTreeData = {
              name: '',
              friends: [],
              links: []
            }
            tempGraphData.name = data.name;
            tempGraphData.friends = data.graphResult.friends;

            data.graphResult.data.forEach(p => {
              tempGraphData.links.push({
                friend: p.friend,
                fof: p.fof
              });
            });

            // to trigger the change , that will be caugth by ngOnChange
            // we need a new "assignment"
            this.fofGraphTreeData = tempGraphData;
            this.fofGraphTreeSubtitleText = "friends tree for " + usersselected;
          }
        }
      },
      (error) => {
        this.error = error;
        this.httpService.showNotification(Alarmtype.DANGER, error);
      }, // error path
      () => {
        //console.log("http call for friends data finished");
        ////console.log("table rows number: " + JSON.stringify(this.graphData));
        //console.log("getFriendsOfFriendsGraphTree : error: " + this.error);
      }
    );
  }

  ngOnInit( ) {

    // subscribe to receive notifications of new chat messages
    this.subscriptionToNewMessages = this.chatService.getNewMessage().subscribe((message: string) => {      
      if (message != this.previousMessage){
        this.previousMessage = message;
        const msg: ChatMessage = JSON.parse(message);
        
        if (this.chatService.whoAmI() === "") return // we are not logged in !!! but socket is still on

        if (msg.to === this.chatService.whoAmI()) { // msg are sent unicast
          this.chatService.showNotification(Alarmtype.SUCCESS, msg.from + " says: " + msg.message, 1);
        }

        // handle user events "disconnect" / "connect"
        if (msg.event) {
          if (msg.event.type === "disconnect") {
            if (msg.event.user === this.chatService.whoAmI()){
              this.chatService.disconnectSocket();
            }else {             
              this.chatService.showNotification(Alarmtype.WARNING, msg.message, 1);
            }
          } else if (msg.event.type === "connect") {
            if (msg.event.user != this.chatService.whoAmI()) {                            
              this.chatService.showNotification(Alarmtype.INFO, msg.message, 1);
            }
          }
        }
      }
    })

    this.graphSubtitleText = "latest in ..."
    this.placesSubtitleText = "in last ... month(s)"
    this.meetingGraphLegendItems = [
      { title: 'Members', imageClass: 'fa fa-circle text-info' },
      { title: 'Place', imageClass: 'fa fa-circle text-danger' },
      { title: 'UserId searched', imageClass: 'fa fa-circle text-warning' }
    ];

    // initialise the objects for data
    this.tableData = {
      headerRow: ["ID", "last seen", "lat", "lng"],
      dataRows: [],
    };

    this.graphData = {
      name: '',
      people: [],
      meeting: { id: 0, date: '' },
      place: { id: 0, name: '', lng: 0, lat: 0 }
    };

    this.fofGraphTreeData = {
      name: '',
      friends: [],
      links: []
    };

    this.placesChartType = ChartType.Pie;
    this.placesChartData = {
      labels: [''],
      series: [0]
    };
    // call to populate the dropdown menu with updated tableData
    this.getListOfLastSpyrecordsForAllUsers("all");

  }

  ngOnDestroy() {
    // unsubscribe from chat
    this.subscriptionToNewMessages.unsubscribe();
   }

}
