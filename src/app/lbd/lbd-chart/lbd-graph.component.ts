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
  static colorLightblue = "#1DC7EA";
  static colorRed = "#FF4A55";
  static colorOrange = "#FF9500";

  error: any;
  graph = Viva.Graph.graph();

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
    ////console.log(" changes detected : " + JSON.stringify(changes));
    this.drawGraph();
    //throw new Error('Method not implemented.');
  }

  public drawGraph() {

    this.graph.clear();
    // remove any svg element in the container that has been created previously
    var e = document.getElementById(this.graphId)
    if (e != null) {
    var child = e.lastElementChild;
    
      while (child) {
        e.removeChild(child);
        child = e.lastElementChild;
      }
    }

    if (this.graphData.people.length != 0) {

      const nameInRequest = this.graphData.name;
      const placeId = this.graphData.place.id;

      var graphics = Viva.Graph.View.svgGraphics();
      var nodeSize = 12;

      const strTrimmedDate = this.graphData.meeting.date.replace('(Coordinated Universal Time)', '');

      this.graph.addNode(this.graphData.place.id, `${this.graphData.place.name}`);
      //tempGraph.addNode(this.graphData.meeting.id, this.graphData.meeting.date);
      //tempGraph.addLink(this.graphData.place.id, this.graphData.meeting.id);
      this.graphData.people.forEach(p => {
        this.graph.addNode(p.name, p.name);
        this.graph.addLink(p.name, this.graphData.place.id);
      });

      graphics.node(function (node) {
        let colorOfNode = LbdGraphComponent.colorLightblue;
        if (node.id === nameInRequest) {
          colorOfNode = LbdGraphComponent.colorOrange;
        } else if (node.id == placeId) {
          colorOfNode = LbdGraphComponent.colorRed;
        }
        // This time it's a group of elements: http://www.w3.org/TR/SVG/struct.html#Groups
        var ui = Viva.Graph.svg('g'),
          // Create SVG text element with user id as content
          svgText = Viva.Graph.svg('text').attr('y', '-4px').text(node.data),
          rect = Viva.Graph.svg('rect')
            .attr('width', nodeSize)
            .attr('height', nodeSize)
            .attr("fill", colorOfNode);

        ui.append(rect);
        ui.append(svgText);
        return ui;
      }).placeNode(function (nodeUI, pos) {
        // 'g' element doesn't have convenient (x,y) attributes, instead
        // we have to deal with transforms: http://www.w3.org/TR/SVG/coords.html#SVGGlobalTransformAttribute
        nodeUI.attr('transform',
          'translate(' +
          (pos.x - nodeSize / 2) + ',' + (pos.y - nodeSize / 2) +
          ')');
      });

      // specify where it should be rendered:
      var renderer = Viva.Graph.View.renderer(this.graph, {
        graphics: graphics,
        container: document.getElementById(this.graphId)
      });
      renderer.run();
      // add time in footer
      this.footerText = `${this.graphData.place.name} 
      @ ${strTrimmedDate}`;
    }
  }

  public ngOnInit(): void {
    this.graphId = `lbd-graph-${LbdGraphComponent.currentId++}`;
  }

  public ngAfterViewInit(): void {

    //console.log(`Graph initiated. ID = #${this.graphId}`);
    //console.log("With graph data : " + JSON.stringify(this.graphData));
    //console.log("With table data : " + JSON.stringify(this.tableData));
    this.drawGraph();

  }

}
