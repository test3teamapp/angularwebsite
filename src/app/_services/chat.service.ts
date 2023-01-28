////
/// code based on 
///  https://github.com/cornflourblue/angular-10-registration-login-example/tree/master/src

import { Injectable, Optional, SkipSelf } from '@angular/core';
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
    LoggedinUsersData,
    ChatMessage,
    SetOnlineStatusResult
} from "./common";
import { isUndefined } from 'util';

const REDIS_API_ENDPOINT = environment.redisapiEndpoint;

declare var $: any;

@Injectable({ providedIn: 'root' })
export class ChatService {
    private isUserLoggedIn: boolean;
    private usernameOfloggedInUser: string = "";
    private user: User;
    public messageSubject: BehaviorSubject<string> = new BehaviorSubject('');
    private socket;
    private previousMessage: string = "";

    constructor(
        private http: HttpClient,
        private accountService: AccountService,
        @Optional() @SkipSelf() sharedService?: ChatService
    ) {
        console.log("ChatService created");
        if (sharedService) {
            throw new Error(
                'ChatService is already created. ');
        }

        if (this.socket == undefined){
            if (this.accountService.userValue != null){
                this.connectSocket(this.accountService.userValue.username, this.accountService.userValue.token);
            }
            
        }
    }

    public connectSocket(username: string, token: string) {
        // switching from not logged in to logged in, so connect
        this.socket = io('http://rheotome.eu:3000');
        this.socket.on("connect", () => {
            console.log("connecting socket " + this.socket.id); // x8WIv7-mJelg7on_ALbx
            this.socket.emit("setUsername", this.accountService.userValue.username, this.accountService.userValue.token);
            this.socket.username = this.accountService.userValue.username;
            this.socket.token = this.accountService.userValue.token;

            this.setOnlineStatus("online").subscribe(
                (data: any) => {
                  // success path
                  if (data.RESULT !== 'OK') {
                    this.showNotification(Alarmtype.WARNING, data.RESULT, 1);
                  }else {
                    this.showNotification(Alarmtype.SUCCESS, "Welcome " + this.accountService.userValue.username, 1);
                  } 
                },
                (error) => {
                  this.showNotification(Alarmtype.DANGER, error, 1);
                }, // error path
                () => {
                  //console.log("http call finished");
                  //console.log("table rows number: " + this.tableData.dataRows.length);
                  //console.log("getListOfLastSpyrecordsForAllUsers : error: " + this.error);
                }
              );

            this.accountService.getLoginStatusObservable().subscribe((isUserLoggedIn: boolean) => {
                console.log("isUserLoggedIn update: " + isUserLoggedIn + ". Socket status:" + ((this.socket == null) ? "null" : this.socket.username)); 
                if (isUserLoggedIn) {
                    if (this.accountService.userValue != null) {
                        this.usernameOfloggedInUser = this.accountService.userValue.username;
                        this.socket.emit("setUsername", this.accountService.userValue.username, this.accountService.userValue.token);
                        this.socket.username = this.accountService.userValue.username;
                        this.socket.token = this.accountService.userValue.token;
                    }
                } else {
                    // the user logged out (by using the loggout button)
                    // online status set to offline and token handling is done by the api 
                    this.usernameOfloggedInUser = "";
                    // disconnect sockets.
                    this.socket.emit("logout");
                    this.socket.disconnect();
                    console.log("isUserLoggedIn update: " + isUserLoggedIn + ". Socket status:" + ((this.socket == null) ? "null" : this.socket.username));
                }
            });
        });
    }

    // used for the case
    // the socket server notified us that the socket is closed from its' end
    // e.g. we closed the browser tab
    // it does not mean we have logged out. Our stored credentials are still valid.
    // but we need to set the chat status in the database
    public disconnectSocket() {
        this.socket.disconnect();
        this.socket = null;

        this.setOnlineStatus("offline").subscribe(
            (data: any) => {
              // success path
              if (data.RESULT !== 'OK') {
                this.showNotification(Alarmtype.WARNING, data.RESULT, 1);
              } 
            },
            (error) => {
              this.showNotification(Alarmtype.DANGER, error, 1);
            }, // error path
            () => {
              //console.log("http call finished");
              //console.log("table rows number: " + this.tableData.dataRows.length);
              //console.log("getListOfLastSpyrecordsForAllUsers : error: " + this.error);
            }
          );

    }

    public clearSocketBuffer() {
        if (this.socket != null) {
            this.socket.sendBuffer = [];
        }

    }

    public whoAmI(): string {
        return this.usernameOfloggedInUser;
    }

    public sendMessage(toUser: string, msg: string) {
        let chatMsg: ChatMessage;
        chatMsg = {
            from: this.accountService.userValue.username,
            to: toUser,
            message: msg
        }
        if (this.socket != null) {
            this.socket.sendBuffer = [];
            this.socket.emit('message', JSON.stringify(chatMsg));
        }
    }

    public getNewMessage = () => {
        this.socket.on('message', (message) => {
            if (message != this.previousMessage) {
                this.previousMessage = message;
                //console.log("this.socket.on('message', :" + message);
                this.messageSubject.next(message);
            }
        });

        return this.messageSubject.asObservable();
    };

    async getOnlineUsers() {

        var result = await this.accountService.verifyLogin();
        //console.log(JSON.stringify(data));
        if (!result) {
            // not verified  credentialls
            this.showNotification(Alarmtype.WARNING, "User not verified. Leave CHAT !", 1);
            return null;
        }
        // continue
        var data = await this.getOnlineUsersFromDB().toPromise();
        //console.log(JSON.stringify(data));
        if (data.RESULT !== 'OK') {
            //console.log(" Response message: " + data.RESULT);
            this.showNotification(Alarmtype.WARNING, data.RESULT, 1);
            return null;
        }
        //continue. return a list of logged in users
        return data.users;
    }

    public getOnlineUsersFromDB(): Observable<LoggedinUsersData> {

        return this.http
            .get<LoggedinUsersData>(REDIS_API_ENDPOINT + "/userrepo/getonline", {
                responseType: "json",
            })
            .pipe(
                map(response => response as LoggedinUsersData),
                catchError(this.handleError) // then handle the error
            );
    }

    public setOnlineStatus(status:string): Observable<SetOnlineStatusResult> {

        return this.http
            .get<LoggedinUsersData>(REDIS_API_ENDPOINT + "/userrepo/setchatstatus/" + status + "/byToken/" + this.accountService.userValue.token, {
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

    showNotification(alarmtype: Alarmtype, msg: string, seconds: number) {

        //var color = Math.floor(Math.random() * 4 + 1);
        $.notify(
            {
                icon: "pe-7s-info",
                message:
                    msg,
            },
            {
                type: alarmtype,
                timer: seconds * 1000,
                placement: {
                    from: "top",
                    align: "center",
                },
            }
        );
    }

}