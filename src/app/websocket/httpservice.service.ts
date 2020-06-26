import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";

import { Observable, throwError } from "rxjs";
import { catchError, retry } from "rxjs/operators";
import "rxjs/add/operator/toPromise";
import { getJSON } from "@ngui/map/services/util";

export interface Spyrecord {
  serialkey: number;
  servertime: string;
  userid: string;
  jsondata: string;
  lat: number;
  lng: number;
}
export class SpyrecordClass {
  constructor(
    public serialkey: number,
    public servertime: string,
    public userid: string,
    public jsondata: string,
    public lat: number,
    public lng: number
  ) {}
}

@Injectable()
export class HttpService {
  //endpointUrl = "http://127.0.0.1:8081/api/v1/";
  endpointUrl = "http://158.101.171.124:8081/api/v1/";
  results: SpyrecordClass[];
  loading: boolean;

  constructor(private http: HttpClient) {
    this.results = [];
    this.loading = false;
  }

  getLastSpyrecordOfUser(userId: string) {
    return this.http
      .get<Spyrecord>(this.endpointUrl + "user/" + userId, {
        responseType: "json",
      })
      .pipe(
        //retry(3), // retry a failed request up to 3 times
        catchError(this.handleError) // then handle the error
      );
  }


  getLastSpyrecordsOfUsers(userIds: string) {
    return this.http
      .get(this.endpointUrl + "users/" + userIds, {
        responseType: "json",
      })
      .pipe(
        //retry(3), // retry a failed request up to 3 times
        catchError(this.handleError) // then handle the error
      );
  }


  getPromiseLastSpyrecordOfUser(userId: string) {
    let promise = new Promise((resolve, reject) => {
      //TODO
      this.http
        .get(this.endpointUrl + "user/" + userId, {
          responseType: "json",
        })
        .toPromise()
        .then(
          (res: any) => {
            // Success
            console.log(res);
            //var checkRes = JSON.parse(res);
            if (res.message){
              // not the result we expected
              console.log(res.message);
              reject(res.message);
            }

            // this.results = res.json().map((item: any) => {
            //   return new SpyrecordClass(
            //     item.serialkey,
            //     item.servertime,
            //     item.userid,
            //     item.jsondata,
            //     item.lat,
            //     item.lng
            //   );
            // });
            resolve(res);
          },
          (err) => {
            // Error
            reject(err);
          }
        );
    });

    return promise;
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error("An error occurred:", error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` + `body was: ${error.error}`
      );
    }
    // return an observable with a user-facing error message
    return throwError("Something bad happened; please try again later.");
  }
}
