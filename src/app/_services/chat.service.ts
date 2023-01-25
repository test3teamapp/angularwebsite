////
/// code based on 
///  https://github.com/cornflourblue/angular-10-registration-login-example/tree/master/src

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { catchError, map } from "rxjs/operators";
import { BehaviorSubject, Subject, Observable, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import { User } from '../_models/user';
import { io } from "socket.io-client";
import { AccountService } from './account.service';

import {
    Alarmtype,
    LoggedinUsersData
} from "./common";
import { isUndefined } from 'util';

const REDIS_API_ENDPOINT = environment.redisapiEndpoint;

declare var $: any;

@Injectable({ providedIn: 'root' })
export class ChatService {
    private logginCheck: boolean = false;
    private user: User;
    public messageSubject: BehaviorSubject<string> = new BehaviorSubject('');

    constructor(
        private router: Router,
        private http: HttpClient,
        private accountService: AccountService
    ) {
        //this.user = new User(JSON.parse(localStorage.getItem('user')));
    }

    socket = io('http://rheotome.eu:3000');

    public sendMessage(message: string) {
        this.socket.emit('message', message);
      }
    
      public getNewMessage = () => {
        this.socket.on('message', (message) =>{
          this.messageSubject.next(message);
        });
        
        return this.messageSubject.asObservable();
      };

    async getLoggedInUsers() {
        this.logginCheck = false;

        var result = await this.accountService.verifyLogin();
        //console.log(JSON.stringify(data));
        if (!result) {
            // not verified  credentialls
            this.showNotification(Alarmtype.WARNING, "User not verified. Leave CHAT !");
            return null;
        } 
        // continue
        var data = await this.getLoggedInUsersFromDB().toPromise();
        //console.log(JSON.stringify(data));
        if (data.RESULT !== 'OK') {            
            //console.log(" Response message: " + data.RESULT);
            this.showNotification(Alarmtype.WARNING, data.RESULT);
            return null;
        } 
        //continue. return a list of logged in users
        return data.users;
    }

    private getLoggedInUsersFromDB(): Observable<LoggedinUsersData> {
        return this.http
            .get<LoggedinUsersData>(REDIS_API_ENDPOINT + "/userrepo/getloggedin", {
                responseType: "json",
            })
            .pipe(
                map(response => response as LoggedinUsersData),
                catchError(this.handleError) // then handle the error
            );
    }

    private handleError(error: HttpErrorResponse) {
        var erroMsg = "";
        if (error.error instanceof ErrorEvent) {
            // A client-side or network error occurred. Handle it accordingly.
            console.error("An error occurred:", error.error.message);
            erroMsg = "An error occurred:" + error.error.message;
        } else {
            // The backend returned an unsuccessful response code.
            // The response body may contain clues as to what went wrong,
            console.error(
                `Backend returned code ${error.status}, ` + `body was: ${error.error}`
            );
            erroMsg = "Backend returned code " + error.status + ", body was: " + error.error;
        }
        // return an observable with a user-facing error message
        return throwError(erroMsg);
    }

    showNotification(alarmtype: Alarmtype, msg: string) {

        //var color = Math.floor(Math.random() * 4 + 1);
        $.notify(
            {
                icon: "pe-7s-attention",
                message:
                    msg,
            },
            {
                type: alarmtype,
                timer: 1000,
                placement: {
                    from: "top",
                    align: "center",
                },
            }
        );
    }

}