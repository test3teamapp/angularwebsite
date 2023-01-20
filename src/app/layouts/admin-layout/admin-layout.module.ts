import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { LbdModule } from '../../lbd/lbd.module';
import { NguiMapModule} from '@ngui/map';
import { WebsocketModule } from '../../websocket/websocket.module';

import { AdminLayoutRoutes } from './admin-layout.routing';

import { HomeComponent } from '../../home/home.component';
import { MapsComponent } from '../../maps/maps.component';


@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(AdminLayoutRoutes),
    FormsModule,
    LbdModule,
    WebsocketModule,
    NguiMapModule.forRoot({apiUrl: })
  ],
  declarations: [
    HomeComponent,
    MapsComponent,
  ]
})

export class AdminLayoutModule {}
