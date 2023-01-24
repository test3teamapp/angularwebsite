import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { LbdModule } from '../../lbd/lbd.module';
import { NguiMapModule} from '@ngui/map';

import { AdminLayoutRoutes } from './admin-layout.routing';

import { HomeComponent } from '../../home/home.component';
import { MapsComponent } from '../../maps/maps.component';
import { ChatComponent } from '../../chat/chat.component';


@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(AdminLayoutRoutes),
    FormsModule,
    LbdModule,
    NguiMapModule.forRoot({apiUrl: 'https://maps.google.com/maps/api/js?key=AIzaSyD_SJhBG9d_s46ME-nP5IP6jZnrQNO7uHs'})
  ],
  declarations: [
    HomeComponent,
    MapsComponent,
    ChatComponent
  ]
})

export class AdminLayoutModule {}
