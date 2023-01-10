import { Component, SimpleChanges, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs/Subscription";
import { map, catchError, tap, switchAll } from "rxjs/operators";
import {
  Spyrecord,
  SpyrecordClass,
  Alarmtype,
  TableData
} from "../_services/common";
import {
  HttpService
} from "../_services/httpservice.service"
import { NguiMapModule, NguiMapComponent } from "@ngui/map";
import { HttpClient } from "@angular/common/http";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { isUndefined } from "util";
import { jsonize } from "@ngui/map/services/util";

@Component({
  selector: "app-maps",
  templateUrl: "./maps.component.html",
  styleUrls: ["./maps.component.css"],
  providers: [HttpService],
  styles: [".error {color: red;}"],
})
export class MapsComponent implements OnInit, OnDestroy {
  error: any;
  headers: string[];
  spyrecord: SpyrecordClass;
  positions = [];
  //map: NguiMapComponent;
  //changes: SimpleChanges;
  googleMapObject: any;

  public tableData1: TableData;

  maxTrackDataReceived : number;

  // allOptions = {
  //   center: {lat: 36.964, lng: -122.015},
  //   zoom: 18,
  //   mapTypeId: 'satellite',
  //   tilt: 45
  // };

  /// thransition to redis db
  /// All methods are the same (in name and function, although return data are slightly different
  // and needed different handling)
  // as with the HttpService we use when the website calls directly the gospy api on the Oracle server
  constructor(private httpService: HttpService, private http: HttpClient) { }

  clear() {
    //this.httpService = undefined;
    this.error = undefined;
    this.headers = undefined;
    this.spyrecord = undefined;
  }

  clearMarkers() {
    //this.httpService = undefined;
    this.positions = [];
  }

  showLastSpyrecordForUser(userselected: string) {
    this.clear();

    this.httpService.getLastSpyrecordOfUser(userselected).subscribe(
      (data: any) => {
        // success path

        if (data.ERROR) {
          // not the result we expected
          console.log(" Response message: " + data.ERROR);
          this.error = data.ERROR;
          //reject(res);
          this.httpService.showNotification(Alarmtype.WARNING, data.ERROR);
        } else {
          //debug
          //console.log("data received for user : " + userselected + " = " + JSON.stringify(data));
          this.spyrecord = new SpyrecordClass(
              1,
              data[0]["locationUpdated"],
              data[0]["name"],
              '{}',
              data[0]["location"]["latitude"],
              data[0]["location"]["longitude"]
            );
          //debug
          //console.log("spyrecord to display for user : " + userselected + " = " + JSON.stringify(this.spyrecord));
        }
        
        if (this.spyrecord !== undefined) {
          //check that parsing is done ok
          //debug
          //console.log("last known position for user : " + userselected + " = " + this.spyrecord.lat + "," + this.spyrecord.lng);
          this.positions.push([this.spyrecord.lat, this.spyrecord.lng]);

          this.googleMapObject.panTo(
            new google.maps.LatLng({
              lat: this.spyrecord.lat,
              lng: this.spyrecord.lng,
            })
          );
          this.googleMapObject.zoom = 18;
        }
      },
      (error) => {
        // error path
        this.error = error;
        this.httpService.showNotification(Alarmtype.DANGER, error);
      },
      () => {
        console.log("http call finished");
        console.log("spyrecord: " + JSON.stringify(this.spyrecord));
        console.log("positions: " + this.positions);
        console.log("showLastSpyrecordForUser : error: " + this.error);
      }
    );
  }

  // will return :
  /*
  {
  "name": "samsungj5",
  "message": [
    "1672876442623-0",
    [
      "longitude",
      "21.7267733",
      "latitude",
      "38.2336"
    ]
  ]
  }
  */

  sendCommandToUserDevice(userselected: string, command: string) {
    this.clear();

    // show a notification so the user knows they have to wait a bit
    this.httpService.showNotification(Alarmtype.INFO, "Wait for device " + userselected + " to respond");

    // our client app handles these commands (as keys in the message)
    //mMsgCommandTRIGGERLU := "TRIGGER_LU"
    //mMsgCommandSTARTTRACKING := "START_TRACKING"
    //mMsgCommandSTOPTRACKING := "STOP_TRACKING"
    // for triggering LU we expect to receive a spyrecord
    // for starting stopping tracking we expect to receive only an ack
    //TODO
    this.httpService.sendCommandToUserDevice(userselected, command).subscribe(
      (data: any) => {
        // success path

        if (data.ERROR) {
          // not the result we expected
          console.log(" Response message: " + data.ERROR);
          this.error = data.ERROR;
          this.httpService.showNotification(Alarmtype.WARNING, data.ERROR);
        }else if (data.command) {
          // not the result we expected
          console.log("Command " + data.command + " sent to device " + data.name);
          this.httpService.showNotification(Alarmtype.SUCCESS, "Command " + data.command + " sent to device " + data.name);
        } else {
          const dateFromMs = new Date(Number(String(data.message[0]).substring(0,13)));

          this.spyrecord = new SpyrecordClass(
            1,
            dateFromMs.toString(),
            data.name,
            '{}',
            Number(data.message[1][3]),
            Number(data.message[1][1])
          );
        }

        if (this.spyrecord !== undefined) {
          this.httpService.showNotification(Alarmtype.SUCCESS, "Device " + userselected +" found");
          //check that parsing is done ok
          this.positions.push([this.spyrecord.lat, this.spyrecord.lng]);

          this.googleMapObject.panTo(
            new google.maps.LatLng({
              lat: this.spyrecord.lat,
              lng: this.spyrecord.lng,
            })
          );
          this.googleMapObject.zoom = 18;
        }
      },
      (error) => {
        // error path
        this.error = error;
        this.httpService.showNotification(Alarmtype.DANGER, error);
      },
      () => {
        console.log("http call finished");
        console.log("spyrecord: " + this.spyrecord);
        console.log("positions: " + this.positions);
        console.log("sendCommandToUserDevice : error: " + this.error);
      }
    );
  }

  /*
From redis , the data comes in this form:
{
  "name": "xiaominote8T",
  "tracks": [
    [
      "1672482216758-0",
      [
        "longitude",
        "38.2333814",
        "latitude",
        "21.7266567"
      ]
    ],
    [
      "1672482264410-0",
      [
        "longitude",
        "38.2332271",
        "latitude",
        "21.7268586"
      ]
    ]
  ]
}
  */

  showPathOfUserForTimePeriod(usersselected: string, pastHours: number) {
    this.clear();

    this.httpService
      .getSpyrecordOfUserForTimePeriod(usersselected, pastHours)
      .subscribe(
        (data: any) => {
          // success path

          if (data.ERROR) {
            // not the result we expected
            console.log(" Response message: " + data.ERROR);
            this.error = data.ERROR;
            //reject(res);
            this.httpService.showNotification(Alarmtype.WARNING, data.ERROR);
          } else {   
            //console.log(`data.tracks : ${data.tracks}`)  
            //console.log(`data.tracks.length : ${data.tracks.length}`)  
            //console.log(`data.tracks[0] : ${data.tracks[0]}`)   
            //console.log(`data.tracks[0][0] : ${data.tracks[0][0]}`)
            //console.log(`data.tracks[0][1] : ${data.tracks[0][1]}`)
            //console.log(`data.tracks[0][1][1] : ${data.tracks[0][1][1]}`)
            //console.log(`data.tracks[0][1][3] : ${data.tracks[0][1][3]}`)

            var flightPlanCoordinates = [];
            var flightPlanPositions = [];
            var markerCounter = 0;
            this.maxTrackDataReceived = 0;
            var routeMarkerImage;
            var routeMarker;

            this.maxTrackDataReceived = data.tracks.length;

            if (this.maxTrackDataReceived < 2){
              this.httpService.showNotification(
                Alarmtype.INFO,
                "Not enough data for path construction."
              );
              return
            }

            data.tracks.map((item) => {
              //console.log(item["Userid"]);
              flightPlanCoordinates.push(
                new google.maps.LatLng({
                  lat: Number(item[1][3]),
                  lng: Number(item[1][1]),
                })
              );
              var image;
              if (markerCounter == 0) {
                routeMarkerImage = "/assets/img/start-flag-icon-0_64x64.png";

              } else if (markerCounter == (this.maxTrackDataReceived - 1)) {
                routeMarkerImage = "/assets/img/flag-racing-png-2_64x64.png";

              } else {
                routeMarkerImage =
                  "https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png";
              }

              markerCounter++;
              const dateFromMs = new Date(Number(String(item[0]).substring(0,13)));
              routeMarker = new google.maps.Marker({
                position: { lat: Number(item[1][3]), lng: Number(item[1][1]) },
                map: this.googleMapObject,
                icon: routeMarkerImage,
                title: dateFromMs.toString(),
              });
            });

            if (flightPlanCoordinates.length > 1) {
              var flightPath = new google.maps.Polyline({
                path: flightPlanCoordinates,
                geodesic: true,
                strokeColor: "#FF0000",
                strokeOpacity: 1.0,
                strokeWeight: 2,
              });

              flightPath.setMap(this.googleMapObject);

              this.googleMapObject.panTo(flightPlanCoordinates[0]);
              this.googleMapObject.zoom = 10;
            } else {
              this.httpService.showNotification(
                Alarmtype.INFO,
                "Not enough data for path construction."
              );
            }
          }
        },
        (error) => {
          this.error = error;
          this.httpService.showNotification(Alarmtype.DANGER, error);
        }, // error path
        () => {
          console.log("http call finished");
          console.log("track locations received: " + this.maxTrackDataReceived);
          console.log("showPathOfUserForTimePeriod : error: " + this.error);
        }
      );
  }

  getListOfLastSpyrecordsForAllUsers(usersselected: string) {
    this.clear();

    this.httpService.getLastSpyrecordsOfUsers(usersselected).subscribe(
      (data: any) => {
        // success path
        let i = 0;
        this.tableData1.dataRows = data.map((item) => {
          //console.log(item);
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
        console.log("http call finished");
        console.log("table rows number: " + this.tableData1.dataRows.length);
        console.log("getListOfLastSpyrecordsForAllUsers : error: " + this.error);
      }
    );
  }

  onMapReady(map) {
    //this.map = map;
    //console.log("map", map);
    //console.log("this.map", this.map);
    //console.log("this.map.map", this.map.map);
    console.log("markers", map.markers); // to get all markers as an array
    this.googleMapObject = map.data.map;
  }
  onIdle(event) {
    console.log("map idle event", event.target);
  }
  onMarkerInit(marker) {
    console.log("marker init", marker);
    //this.googleMapObject.panTo(marker.latLng);
  }
  onMapClick(event) {
    //this.positions.push(event.latLng);
    event.target.panTo(event.latLng);
  }

  ngOnInit() {
    this.tableData1 = {
      headerRow: ["ID", "last seen", "lat", "lng"],
      dataRows: [],
    };

    this.getListOfLastSpyrecordsForAllUsers("all");
  }

  ngOnDestroy() { }
}
