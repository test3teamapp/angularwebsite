import { Component, Input, OnInit, AfterViewInit, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import * as Chartist from 'chartist';
import { LegendItem } from './lbd-chart.component';
import * as Viva from 'vivagraphjs';

import {
  TableData,
  GraphData,
  GraphPerson,
  GraphMeeting,
  GraphPlace
} from "../../_services/common";

@Component({
  selector: 'lbd-graph',
  templateUrl: './lbd-graph.component.html',
  changeDetection: ChangeDetectionStrategy.Default
})
export class LbdGraphComponent implements OnInit, AfterViewInit, OnChanges {
  static currentId = 1;
  error: any;

  @Input()
  public title: string;

  @Input()
  public subtitle: string;

  @Input()
  public graphData: GraphData;

  @Input()
  public tableData: TableData;

  @Input()
  public footerIconClass: string;

  @Input()
  public footerText: string;

  @Input()
  public legendItems: LegendItem[];

  @Input()
  public withHr: boolean;

  public graphId: string;

  constructor() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log(" changes detected : " + JSON.stringify(changes));
    this.drawGraph();
    //throw new Error('Method not implemented.');
  }

  public drawGraph() {
    var graph = Viva.Graph.graph();

    if (this.graphData.people.length != 0) {
      graph.addNode(this.graphData.place.id, this.graphData.place.name);
      graph.addNode(this.graphData.meeting.id, this.graphData.meeting.date);
      graph.addLink(this.graphData.place.id, this.graphData.meeting.id);
      this.graphData.people.forEach(p => {
        graph.addNode(p.name, p.name);
        graph.addLink(p.name, this.graphData.meeting.id);
      });

      // specify where it should be rendered:
      var renderer = Viva.Graph.View.renderer(graph, {
        container: document.getElementById(this.graphId)
      });
      renderer.run();
    }
  }

  public ngOnInit(): void {
    this.graphId = `lbd-graph-${LbdGraphComponent.currentId++}`;
  }

  public ngAfterViewInit(): void {

    console.log(`Graph initiated. ID = #${this.graphId}`);
    console.log("With graph data : " + JSON.stringify(this.graphData));
    console.log("With table data : " + JSON.stringify(this.tableData));
    this.drawGraph();

  }

}
