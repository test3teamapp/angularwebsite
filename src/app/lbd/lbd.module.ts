
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { LbdChartComponent } from './lbd-chart/lbd-chart.component';
import { LbdGraphComponent } from './lbd-chart/lbd-graph.component';
import { LbdTreeGraphComponent } from './lbd-chart/lbd-tree-graph.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule
  ],
  declarations: [

    LbdChartComponent,
    LbdGraphComponent,
    LbdTreeGraphComponent

  ],
  exports: [
    LbdChartComponent,
    LbdGraphComponent,
    LbdTreeGraphComponent
  ]
})
export class LbdModule { }
