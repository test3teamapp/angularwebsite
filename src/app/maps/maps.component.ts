import { Component, SimpleChanges, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs/Subscription";
import { map, catchError, tap, switchAll } from "rxjs/operators";
import { Spyrecord, HttpService } from "../websocket/httpservice.service";
import { NguiMapModule, NguiMapComponent} from '@ngui/map';

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
  map: NguiMapComponent;
  changes: SimpleChanges;


  constructor(private httpService: HttpService) {}

  clear() {
    this.httpService = undefined;
    this.error = undefined;
    this.headers = undefined;
  }

  showLastSpyrecordForUser() {
    this.httpService.getLastSpyrecordOfUser("UNKNOWN").subscribe(
      (data: Spyrecord) =>
        (this.spyrecord = {
          serialkey: data["Serialkey"],
          servertime: data["Servertime"],
          userid: data["Userid"],
          jsondata: data["Jsondata"],
          lat: data["Lat"],
          lng: data["Lng"],
        }), // success path
      (error) => (this.error = error) // error path
    );

    console.log(this.spyrecord);
    console.log(this.positions);

    if (this.spyrecord) {
      this.positions.push(
        [ this.spyrecord.lat, this.spyrecord.lng ]
      );
      
      this.map.map.panTo(new google.maps.LatLng({lat: this.spyrecord.lat, lng: this.spyrecord.lng}));
    }
  }

  onMapReady(map) {
    this.map = map;
    console.log("map", map);
    console.log("this.map", this.map);
    console.log("markers", map.markers); // to get all markers as an array
  }
  onIdle(event) {
    console.log("map event", event.target);
  }
  onMarkerInit(marker) {
    console.log("marker init", marker);
  }
  onMapClick(event) {
    //this.positions.push(event.latLng);
    event.target.panTo(event.latLng);
  }

  ngOnInit() {}

  ngOnDestroy() {}
}
