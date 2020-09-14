import { Component, SimpleChanges, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs/Subscription";
import { map, catchError, tap, switchAll } from "rxjs/operators";
import {
  Spyrecord,
  SpyrecordClass,
  HttpService,
  Alarmtype,
} from "../websocket/httpservice.service";
import { NguiMapModule, NguiMapComponent } from "@ngui/map";
import { HttpClient } from "@angular/common/http";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { isUndefined } from "util";

declare interface TableData {
  headerRow: string[];
  dataRows: SpyrecordClass[];
}

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
  spyrecord: Spyrecord;
  positions = [];
  //map: NguiMapComponent;
  //changes: SimpleChanges;
  googleMapObject: any;

  public tableData1: TableData;

  // allOptions = {
  //   center: {lat: 36.964, lng: -122.015},
  //   zoom: 18,
  //   mapTypeId: 'satellite',
  //   tilt: 45
  // };

  constructor(private httpService: HttpService, private http: HttpClient) {}

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

        if (data.message) {
          // not the result we expected
          console.log(" Response message: " + data.message);
          this.error = data.message;
          //reject(res);
          this.httpService.showNotification(Alarmtype.WARNING, data.message);
        } else {
          this.spyrecord = {
            serialkey: data["Serialkey"],
            servertime: data["Servertime"],
            userid: data["Userid"],
            jsondata: data["Jsondata"],
            lat: data["Lat"],
            lng: data["Lng"],
          };
        }

        if (this.spyrecord !== undefined) {
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
        console.log("error: " + this.error);
      }
    );
  }

  sendCommandOnUserDevice(userselected: string, command: string) {
    this.clear();

    // our client app handles these commands (as keys in the message)
	  //mMsgCommandTRIGGERLU := "TRIGGER_LU"
	  //mMsgCommandSTARTTRACKING := "START_TRACKING"
    //mMsgCommandSTOPTRACKING := "STOP_TRACKING"
    // for triggering LU we expect to receive a spyrecord
    // for starting stopping tracking we expect to receive only an ack
    //TODO
    this.httpService.sendCommandOnUserDevice(userselected, command).subscribe(
      (data: any) => {
        // success path

        if (data.message) {
          // not the result we expected
          console.log(" Response message: " + data.message);
          this.error = data.message;
          //reject(res);
          this.httpService.showNotification(Alarmtype.WARNING, data.message);
        } else {
          this.spyrecord = {
            serialkey: data["Serialkey"],
            servertime: data["Servertime"],
            userid: data["Userid"],
            jsondata: data["Jsondata"],
            lat: data["Lat"],
            lng: data["Lng"],
          };
        }

        if (this.spyrecord !== undefined) {
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
        console.log("error: " + this.error);
      }
    );
  }

  showPathOfUserForTimePeriod(usersselected: string, pastHours: number) {
    this.clear();

    this.httpService
      .getSpyrecordOfUserForTimePeriod(usersselected, pastHours)
      .subscribe(
        (data: any) => {
          // success path

          if (data.message) {
            // not the result we expected
            console.log(" Response message: " + data.message);
            this.error = data.message;
            //reject(res);
            this.httpService.showNotification(Alarmtype.WARNING, data.message);
          } else {
            var flightPlanCoordinates = [];
            var flightPlanPositions = [];
            var markerCounter = 0;
            var maxDataReceived = 0;
            var routeMarkerImage;
            var routeMarker;

            data.map((item) => {
              maxDataReceived++;
            });

            data.map((item) => {
              //console.log(item["Userid"]);
              flightPlanCoordinates.push(
                new google.maps.LatLng({
                  lat: item["Lat"],
                  lng: item["Lng"],
                })
              );
              var image;
              if (markerCounter == 0) {
                routeMarkerImage = "/assets/img/start-flag-icon-0_64x64.png";

              }else if (markerCounter == maxDataReceived - 1){
                routeMarkerImage = "/assets/img/flag-racing-png-2_64x64.png";

              }else {
                routeMarkerImage =
                  "https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png";
              } 

              markerCounter++;
              routeMarker = new google.maps.Marker({
                position: { lat: item["Lat"], lng: item["Lng"] },
                map: this.googleMapObject,
                icon: routeMarkerImage,
                title: item["Servertime"],
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
          console.log("table rows number: " + this.tableData1.dataRows.length);
          console.log("error: " + this.error);
        }
      );
  }

  getListOfLastSpyrecordsForAllUsers(usersselected: string) {
    this.clear();

    this.httpService.getLastSpyrecordsOfUsers(usersselected).subscribe(
      (data: any) => {
        // success path

        if (data.message) {
          // not the result we expected
          console.log(" Response message: " + data.message);
          this.error = data.message;
          //reject(res);
          this.httpService.showNotification(Alarmtype.WARNING, data.message);
        } else {
          this.tableData1.dataRows = data.map((item) => {
            //console.log(item["Userid"]);
            return new SpyrecordClass(
              item["Serialkey"],
              item["Servertime"],
              item["Userid"],
              item["Jsondata"],
              item["Lat"],
              item["Lng"]
            );
          });
        }
      },
      (error) => {
        this.error = error;
        this.httpService.showNotification(Alarmtype.DANGER, error);
      }, // error path
      () => {
        console.log("http call finished");
        console.log("table rows number: " + this.tableData1.dataRows.length);
        console.log("error: " + this.error);
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

  ngOnDestroy() {}
}
