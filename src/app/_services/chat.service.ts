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

import {
    Alarmtype,
    LoginCheckData
} from "./common";
import { isUndefined } from 'util';

const REDIS_API_ENDPOINT = environment.redisapiEndpoint;

declare var $: any;

@Injectable({ providedIn: 'root' })
export class ChatService {
    private logginCheck: boolean = false;
    private user: User;

    constructor(
        private router: Router,
        private http: HttpClient
    ) {
        //this.user = new User(JSON.parse(localStorage.getItem('user')));
    }

    socket = io('http://rheotome.eu:3000');

    async login(username: string, password: string) {
        this.logginCheck = false;

        var data = await this.checkUserPassword(username, password).toPromise();
        //console.log(JSON.stringify(data));
        if (data.RESULT !== 'OK') {
            // not correct credentialls
            //console.log(" Response message: " + data.RESULT);
            this.showNotification(Alarmtype.WARNING, data.RESULT);
            this.logginCheck = false;
        } else {
            this.logginCheck = true;
        }

        //console.log("login check : " + this.logginCheck);
        if (this.logginCheck) {
            const user = {
                id: '',
                username: username,
                password: "",
                firstName: "",
                lastName: "",
                token: data.token
            };

            return user;
        } else {
            return null;
        }
    }

    private checkUserPassword(userId: string, userPass: string): Observable<LoginCheckData> {
        return this.http
            .get<LoginCheckData>(REDIS_API_ENDPOINT + "/userrepo/checkpass/byName/" + userId + "/pass/" + userPass, {
                responseType: "json",
            })
            .pipe(
                map(response => response as LoginCheckData),
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