import { Component, Input, OnInit, AfterViewInit, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { LegendItem } from './lbd-chart.component';
import * as Viva from 'vivagraphjs';

import {
  TableData,
  GraphData,
  GraphPerson,
  GraphMeeting,
  GraphPlace,
  GraphTreeData
} from "../../_services/common";

@Component({
  selector: 'lbd-tree-graph',
  templateUrl: './lbd-tree-graph.component.html',
  changeDetection: ChangeDetectionStrategy.Default
})
export class LbdTreeGraphComponent implements OnInit, AfterViewInit, OnChanges {
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
  public graphData: GraphTreeData;

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

    if (this.graphData.friends.length != 0) {

      const nameInRequest = this.graphData.name;

      var graphics = Viva.Graph.View.svgGraphics(),
        nodeSize = 12;

      this.graph.addNode(this.graphData.name, this.graphData.name);
      this.graphData.friends.forEach(p => { // there are strings
        this.graph.addNode(p, p);
        this.graph.addLink(p, this.graphData.name);
      });
      // do Friend of friend
      this.graphData.links.forEach(p => { // there are {}
        if ( ! this.graph.getNode(p.friend) ){
          this.graph.addNode(p.friend, p.friend);
        }
        if ( ! this.graph.getNode(p.fof) ){
          this.graph.addNode(p.fof, p.fof);
        }
        this.graph.addLink(p.friend, p.fof);
      });

      graphics.node(function (node) {
        let colorOfNode = LbdTreeGraphComponent.colorLightblue;
        if (node.id === nameInRequest) {
          colorOfNode = LbdTreeGraphComponent.colorOrange;
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

      this.footerText = ``;
    }
  }

  public ngOnInit(): void {
    this.graphId = `lbd-tree-graph-${LbdTreeGraphComponent.currentId++}`;
  }

  public ngAfterViewInit(): void {

    console.log(`Tree Graph initiated. ID = #${this.graphId}`);
    console.log("With tree graph data : " + JSON.stringify(this.graphData));
    console.log("With table data : " + JSON.stringify(this.tableData));
    this.drawGraph();

  }

}
