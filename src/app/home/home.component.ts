import { Component, OnDestroy, OnInit } from '@angular/core';
import { LocationStrategy, PlatformLocation, Location } from '@angular/common';
import { LegendItem, ChartType } from '../lbd/lbd-chart/lbd-chart.component';
import * as Chartist from 'chartist';
import { Subscription } from "rxjs/Subscription";
import { map, catchError, tap, switchAll } from "rxjs/operators";
import {
  Spyrecord,
  SpyrecordClass,
  Alarmtype,
  TableData,
  GraphData
} from "../_services/common";
import {
  HttpService
} from "../_services/httpservice.service"
import { Viva } from 'vivagraphjs';


import { NguiMapModule, NguiMapComponent } from "@ngui/map";
import { HttpClient } from "@angular/common/http";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [HttpService],
})
export class HomeComponent implements OnInit, OnDestroy {
  error: any;
  public tableData: TableData;
  public graphData: GraphData;
  public graphFooterTimeText: string;

  public emailChartType: ChartType;
  public emailChartData: any;
  public emailChartLegendItems: LegendItem[];

  public hoursChartType: ChartType;
  public hoursChartData: any;
  public hoursChartOptions: any;
  public hoursChartResponsive: any[];
  public hoursChartLegendItems: LegendItem[];

  public activityChartType: ChartType;
  public activityChartData: any;
  public activityChartOptions: any;
  public activityChartResponsive: any[];
  public activityChartLegendItems: LegendItem[];
  constructor(private httpService: HttpService) { }

  getListOfLastSpyrecordsForAllUsers(usersselected: string) {

    this.httpService.getLastSpyrecordsOfUsers(usersselected).subscribe(
      (data: any) => {
        // success path
        let i = 0;
        this.tableData.dataRows = data.map((item) => {
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
        console.log("table rows number: " + this.tableData.dataRows.length);
        console.log("getListOfLastSpyrecordsForAllUsers : error: " + this.error);
      }
    );
  }

  getMeetingDataForUser(usersselected: string) {

    this.httpService.getMeetingDataForUser(usersselected).subscribe(
      (data: any) => {
        // success path
        if (data.ERROR) {
          // not the result we expected
          console.log(" Response message: " + data.ERROR);
          this.error = data.ERROR;
          //reject(res);
          this.httpService.showNotification(Alarmtype.WARNING, data.ERROR);
        } else {
          if (data.graphResult.data.length == 0) {
            this.httpService.showNotification(Alarmtype.INFO, "NO MEETING IN THE TIME PERIOD SPECIFIED");
          } else {
            let tempGraphData: GraphData;
            tempGraphData = {
              people: [],
              meeting: {id:0, date: ''},
              place: {id:0, name: '', lng: 0, lat: 0}
            };

            data.graphResult.data[0].allp.forEach(p => {
              tempGraphData.people.push({id: p.id, name: p.properties.name});
            });
          
            tempGraphData.meeting = {id: data.graphResult.data[0].m.id, date: data.graphResult.data[0].m.properties.stringDate};
            tempGraphData.place = {
              id: data.graphResult.data[0].pl.id, 
              name: data.graphResult.data[0].pl.properties.name,
              lng: Number(data.graphResult.data[0].pl.properties.lng),
              lat: Number(data.graphResult.data[0].pl.properties.lat),
            }; 
            // to trigger the change , that will be caugth by ngOnChange
            // we need a new "assignment"
            this.graphData = tempGraphData;
          }
        }
      },
      (error) => {
        this.error = error;
        this.httpService.showNotification(Alarmtype.DANGER, error);
      }, // error path
      () => {
        console.log("http call for meeting data finished");
        //console.log("table rows number: " + JSON.stringify(this.graphData));
        console.log("getMeetingDataForUser : error: " + this.error);
      }
    );
  }

  ngOnInit() {

    // initialise the objects for data
    this.tableData = {
      headerRow: ["ID", "last seen", "lat", "lng"],
      dataRows: [],
    };

    this.graphData = {
      people: [],
      meeting: {id:0, date: ''},
      place: {id:0, name: '', lng: 0, lat: 0}
    };
    // call to populate the dropdown menu with updated tableData
    this.getListOfLastSpyrecordsForAllUsers("all");

    ///// --------------------------
    this.emailChartType = ChartType.Pie;
    this.emailChartData = {
      labels: ['62%', '32%', '6%'],
      series: [62, 32, 6]
    };
    this.emailChartLegendItems = [
      { title: 'Open', imageClass: 'fa fa-circle text-info' },
      { title: 'Bounce', imageClass: 'fa fa-circle text-danger' },
      { title: 'Unsubscribe', imageClass: 'fa fa-circle text-warning' }
    ];

    this.hoursChartType = ChartType.Line;
    this.hoursChartData = {
      labels: ['9:00AM', '12:00AM', '3:00PM', '6:00PM', '9:00PM', '12:00PM', '3:00AM', '6:00AM'],
      series: [
        [287, 385, 490, 492, 554, 586, 698, 695, 752, 788, 846, 944],
        [67, 152, 143, 240, 287, 335, 435, 437, 539, 542, 544, 647],
        [23, 113, 67, 108, 190, 239, 307, 308, 439, 410, 410, 509]
      ]
    };
    this.hoursChartOptions = {
      low: 0,
      high: 800,
      showArea: true,
      height: '245px',
      axisX: {
        showGrid: false,
      },
      lineSmooth: Chartist.Interpolation.simple({
        divisor: 3
      }),
      showLine: false,
      showPoint: false,
    };
    this.hoursChartResponsive = [
      ['screen and (max-width: 640px)', {
        axisX: {
          labelInterpolationFnc: function (value) {
            return value[0];
          }
        }
      }]
    ];
    this.hoursChartLegendItems = [
      { title: 'Open', imageClass: 'fa fa-circle text-info' },
      { title: 'Click', imageClass: 'fa fa-circle text-danger' },
      { title: 'Click Second Time', imageClass: 'fa fa-circle text-warning' }
    ];

    this.activityChartType = ChartType.Bar;
    this.activityChartData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      series: [
        [542, 443, 320, 780, 553, 453, 326, 434, 568, 610, 756, 895],
        [412, 243, 280, 580, 453, 353, 300, 364, 368, 410, 636, 695]
      ]
    };
    this.activityChartOptions = {
      seriesBarDistance: 10,
      axisX: {
        showGrid: false
      },
      height: '245px'
    };
    this.activityChartResponsive = [
      ['screen and (max-width: 640px)', {
        seriesBarDistance: 5,
        axisX: {
          labelInterpolationFnc: function (value) {
            return value[0];
          }
        }
      }]
    ];
    this.activityChartLegendItems = [
      { title: 'Tesla Model S', imageClass: 'fa fa-circle text-info' },
      { title: 'BMW 5 Series', imageClass: 'fa fa-circle text-danger' }
    ];


  }

  ngOnDestroy() { }

}
