////
/// code based on 
///  https://github.com/cornflourblue/angular-10-registration-login-example/tree/master/src

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { catchError, map } from "rxjs/operators";
import { BehaviorSubject, Subject, Observable, throwError, Subscription } from 'rxjs';

import { environment } from '../../environments/environment';
import { User } from '../_models/user';

import {
    Alarmtype,
    ChatMessage,
    ERROR_MESSAGE,
    LoginCheckData,
    TempLoginData
} from "../_services/common";
import { isUndefined } from 'util';
import { ChatService } from './chat.service';

const REDIS_API_ENDPOINT = environment.redisapiEndpoint;

declare var $: any;

@Injectable({ providedIn: 'root' })
export class AccountService {
    private subscriptionToNewMessages: Subscription;
    private subscriptionToExpirationOfUser: Subscription;
    private previousMessage: string = "";
    private logginCheck: boolean = false;
    private ignoreConnectionMessageOfThisUser = true; // we need to ignore the innitial message 
    // sent by the socket, about this user connecting.
    // BUT WE NEED TO LISTEN TO OTHER SUCH MESSAGES
    // TO IDENTIFY WHEN A USER MIGHT HAVE LOGGED IN IN
    // SOME OTHER BROWSER
    private userSubject: BehaviorSubject<User>;
    private loginStatusSubject: BehaviorSubject<Boolean>;

    constructor(
        private chatService: ChatService,
        private router: Router,
        private http: HttpClient
    ) {
        this.loginStatusSubject = new BehaviorSubject(false);
        this.userSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('user')));
        if (this.userSubject.value != null) {
            this.logginCheck = true;
            console.log("AccountService : user = " + this.userSubject.value.username);
            // verify login. check token basically
            this.verifyLoginByToken().subscribe(
                (data: LoginCheckData) => {
                    // success path
                    if (data.RESULT !== 'OK') {
                        console.log("token not valid. deleting local stored user data ");
                        this.removeLocalCredentialsAndSockets(false);

                    } else {
                        //console.log("setting chat user : " + this.userSubject.value);
                        this.chatService.setUser(this.userSubject.value, false); // first do this !!!!!
                        this.loginStatusSubject.next(this.logginCheck);
                        // subscribe to get messages to all pages
                        this.subscribeForChatMessages();
                        this.subscribeForUseExpirationNotification();
                    }
                },
                (error) => {
                    this.showNotification(Alarmtype.DANGER, error, 1);
                }, // error path
                () => {

                });


        } else {
            this.userSubject.next(null);
            //console.log("setting chat user : null");
            this.chatService.setUser(null, false);
            console.log("AccountService : user = undefined");
        }

    }

    private removeLocalCredentialsAndSockets(dueToLogout: boolean) {
        this.chatService.setUser(null, dueToLogout);
        this.logginCheck = false;
        this.loginStatusSubject.next(this.logginCheck);
        // remove user from local storage and set current user to null
        localStorage.removeItem('user');
        this.userSubject.next(null);
        // unsubscribe from chat
        if (this.subscriptionToNewMessages != undefined) {
            this.subscriptionToNewMessages.unsubscribe();
        }
        if (this.subscriptionToExpirationOfUser != undefined){
            this.subscriptionToExpirationOfUser.unsubscribe();
        }
        this.router.navigate(['/account/login']);
    }

    private subscribeForUseExpirationNotification() {
        // subscribe to receive notification when the user login credentials get expired
        this.subscriptionToExpirationOfUser = this.chatService.getUserExpiration().subscribe((isExpired: boolean) => {
            if (isExpired) {
                console.log("user expired. deleting local stored user data and logging out ");
                this.chatService.showNotification(Alarmtype.WARNING, "YOU ARE EXPIRED. GET OUT !", 3);
                this.removeLocalCredentialsAndSockets(true);                
            }

        })
    }

    private subscribeForChatMessages() {
        // subscribe to receive notifications of new chat messages
        this.subscriptionToNewMessages = this.chatService.getNewMessage().subscribe((message: string) => {
            if (message != "") {
                this.previousMessage = message;
                const msg: ChatMessage = JSON.parse(message);
                //console.log("router.url = " + this.router.url);
                if (msg.to === this.chatService.whoAmI() && this.router.url != "/chat") { // msg are sent unicast
                    this.chatService.showNotification(Alarmtype.SUCCESS, msg.from + " says: " + msg.message, 1);
                }

                // handle user events "disconnect" / "connect"
                if (msg.event) {
                    if (msg.event.type === "disconnect") {
                        if (msg.event.user === this.chatService.whoAmI()) {
                            console.log("Event from socket = disconnect this user");
                            // check if this loggin credentials are correct
                            this.verifyLoginByToken().subscribe(
                                (data: LoginCheckData) => {
                                    if (data.RESULT !== 'OK') {
                                        console.log("token not valid. deleting local stored user data ");
                                        this.removeLocalCredentialsAndSockets(false);
                                    }
                                },
                                (error) => {
                                    this.showNotification(Alarmtype.DANGER, error, 1);
                                }, // error path
                                () => {

                                });
                        } else {
                            this.chatService.showNotification(Alarmtype.WARNING, msg.message, 1);
                        }
                    } else if (msg.event.type === "connect") {
                        if (msg.event.user != this.chatService.whoAmI()) {
                            this.chatService.showNotification(Alarmtype.INFO, msg.message, 1);
                        } else {
                            console.log("Event from socket = connect for current user");
                            // user connected from somewhere else 
                            // close this user connect and remove local credentials
                            // check if this loggin credentials are correct
                            this.verifyLoginByToken().subscribe(
                                (data: LoginCheckData) => {
                                    // success path
                                    if (data.RESULT !== 'OK') {
                                        console.log("token not valid. deleting local stored user data ");
                                        this.removeLocalCredentialsAndSockets(false);
                                    }
                                },
                                (error) => {
                                    this.showNotification(Alarmtype.DANGER, error, 1);
                                }, // error path
                                () => {

                                });

                        }
                    }
                }
            }
        })
    }

    public getLoginStatusObservable = () => {
        this.loginStatusSubject.next(this.logginCheck);
        return this.loginStatusSubject.asObservable();
    };

    public get userValue(): User {
        return this.userSubject.value;
    }


    private rand = () => {
        return Math.random().toString(36).substr(2);
    };

    private token = () => {
        return this.rand() + this.rand();
    };

    public async requestVisitorId() {

        var data = await this.requestTempUser().toPromise();
        //console.log(JSON.stringify(data));
        if (data.RESULT !== 'OK') {
            //console.log(" Response message: " + data.RESULT);
            this.showNotification(Alarmtype.WARNING, data.RESULT, 1);
            return null;
        } else {
            const user = {
                id: "",
                username: data.username,
                password: data.password,
                firstName: "",
                lastName: "",
                token: "",
                chat: "",
                expires: ""
            };
            return user;
        }
    }

    private requestTempUser(): Observable<TempLoginData> {
        return this.http
            .get<TempLoginData>(REDIS_API_ENDPOINT + "/userrepo/tempvisitor", {
                responseType: "json",
            })
            .pipe(
                map(response => response as TempLoginData),
                catchError(this.handleError) // then handle the error
            );
    }

    public async login(username: string, password: string) {
        this.logginCheck = false;
        this.loginStatusSubject.next(this.logginCheck);

        var data = await this.checkUserPassword(username, password).toPromise();
        //console.log(JSON.stringify(data));
        if (data.RESULT !== 'OK') {
            // not correct credentialls
            //console.log(" Response message: " + data.RESULT);
            this.showNotification(Alarmtype.WARNING, data.RESULT, 1);
            this.logginCheck = false;
            this.loginStatusSubject.next(this.logginCheck);
        } else {
            this.logginCheck = true;
            this.loginStatusSubject.next(this.logginCheck);
        }

        //console.log("login check : " + this.logginCheck);
        if (this.logginCheck) {
            const user = {
                id: this.token(),
                username: username,
                password: "",
                firstName: "",
                lastName: "",
                token: data.token,
                chat: "online",
                expires: data.expires
            };

            localStorage.setItem('user', JSON.stringify(user));
            // publish updated user to subscribers
            this.userSubject.next(user);
            //console.log("setting chat user : " + this.userSubject.value);
            this.chatService.setUser(this.userSubject.value, false); // first do this !!!!!
            // subscribe to get messages to all pages
            this.subscribeForChatMessages();
            this.subscribeForUseExpirationNotification();

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

    async verifyLogin(): Promise<boolean> {

        var data = await this.verifyLoginByToken().toPromise();
        //console.log(JSON.stringify(data));
        if (data.RESULT !== 'OK') {
            // not correct credentialls
            //console.log(" Response message: " + data.RESULT);
            this.showNotification(Alarmtype.WARNING, data.RESULT, 1);
            return false;
        } else {
            return true;
        }
    }

    private verifyLoginByToken(): Observable<LoginCheckData> {
        return this.http
            .get<LoginCheckData>(REDIS_API_ENDPOINT + "/userrepo/verify/byToken/" + this.userSubject.value.token, {
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

    showNotification(alarmtype: Alarmtype, msg: string, seconds: number) {

        //var color = Math.floor(Math.random() * 4 + 1);
        $.notify(
            {
                icon: "pe-7s-attention",
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

    async logout() {
        console.log("User logging out : setting chat user : null");
        var data = await this.logoutUser(this.userSubject.value.token).toPromise();
        //console.log(JSON.stringify(data));
        if (data.RESULT !== 'OK') {
            this.showNotification(Alarmtype.WARNING, data.RESULT, 1);
        }
        this.removeLocalCredentialsAndSockets(true);

    }

    private logoutUser(token: string): Observable<LoginCheckData> {
        return this.http
            .get<LoginCheckData>(REDIS_API_ENDPOINT + "/userrepo/logout/byToken/" + token, {
                responseType: "json",
            })
            .pipe(
                map(response => response as LoginCheckData),
                catchError(this.handleError) // then handle the error
            );
    }

}