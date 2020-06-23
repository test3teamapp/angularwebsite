import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { Observer } from "rxjs/Observer";
import { retryWhen, delayWhen, map, catchError, tap, switchAll } from "rxjs/operators";
import { EMPTY, Subject, timer } from 'rxjs';
import { webSocket, WebSocketSubject } from "rxjs/webSocket";
//import * as socketIo from "socket.io-client";
import { environment } from '../../environments/environment';
export const WS_ENDPOINT = environment.wsEndpoint;
export const RECONNECT_INTERVAL = environment.reconnectInterval;
//import { Socket } from "socket.io-client"; //"../shared/interfaces";

//declare var io: {
//  connect(url: string): Socket;
//};

@Injectable()
export class DataService {
  //socket: SocketIOClient.Socket;
  private socket$: WebSocketSubject<any>;
  private messagesSubject$ = new Subject();
  public messages$ = this.messagesSubject$.pipe(switchAll(), catchError(e => { throw e }));
  observer: Observer<number>;

  constructor() {
    /*
    this.socket = socketIo("ws://localhost:8081", {
      path: "/api/v1/ws",
      transports: ["polling","websocket"],
    });
    */
  }

    // on reconnection, reset the transports option, as the Websocket
    // connection may have failed (caused by proxy, firewall, browser, ...)
    //this.socket.on("reconnect_attempt", () => {
    //  this.socket.io.opts.transports = ["polling", "websocket"];
    //});
  
  
/**
   * Creates a new WebSocket subject and send it to the messages subject
   * @param cfg if true the observable will be retried.
   */
  public connect(cfg: { reconnect: boolean } = { reconnect: false }): void {

    if (!this.socket$ || this.socket$.closed) {
      this.socket$ = this.getNewWebSocket();
      const messages = this.socket$.pipe(cfg.reconnect ? this.reconnect : o => o,
        tap({
          error: error => console.log(error),
        }), catchError(_ => EMPTY));
      // toDO only next an observable if a new subscription was made double-check this
      this.messagesSubject$.next(messages);
    }
  }

  /**
   * Retry a given observable by a time span
   * @param o the observable to be retried
   */
  private reconnect(o: Observable<any>): Observable<any> {
    return o.pipe(retryWhen(errors => errors.pipe(tap(val => console.log('[Data Service] Try to reconnect', val)),
      delayWhen(_ => timer(RECONNECT_INTERVAL)))));
  }
  private getNewWebSocket() {
    return webSocket(WS_ENDPOINT);
  }

  // getQuotes(): Observable<number> {
  //   this.socket.on("data", (res) => {
  //     this.observer.next(res.data);
  //   });

  //   return this.createObservable();
  // }

  sendMessage(msg: string) {
    //this.socket.emit("sendMessage", { message: msg });
    this.socket$.next(msg);
  }

  createObservable(): Observable<number> {
    return new Observable<number>((observer) => {
      this.observer = observer;
    });
  }

  close() {
    this.socket$.complete(); 
  }

  private handleError(error) {
    console.error("server error:", error);
    if (error.error instanceof Error) {
      let errMessage = error.error.message;
      return Observable.throw(errMessage);
    }
    return Observable.throw(error || "websocket server error");
  }
}
