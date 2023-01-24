import { Routes } from '@angular/router';

import { HomeComponent } from '../../home/home.component';
import { MapsComponent } from '../../maps/maps.component';
import { ChatComponent } from '../../chat/chat.component';


export const AdminLayoutRoutes: Routes = [
    { path: 'dashboard',      component: HomeComponent },
    { path: 'maps',           component: MapsComponent },
    { path: 'chat',           component: ChatComponent }
];
