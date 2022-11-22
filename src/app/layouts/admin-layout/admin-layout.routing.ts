import { Routes } from '@angular/router';

import { HomeComponent } from '../../home/home.component';
import { MapsComponent } from '../../maps/maps.component';



export const AdminLayoutRoutes: Routes = [
    { path: 'dashboard',      component: HomeComponent },
    { path: 'maps',           component: MapsComponent },
];
