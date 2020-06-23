import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";

import { Observable, throwError } from "rxjs";
import { catchError, retry } from "rxjs/operators";

export interface Spyrecord {
  serialkey: number;
  servertime: string;
  userid: string;
  jsondata: string;
  lat: number;
  lng: number;
}

@Injectable()
export class HttpService {
  endpointUrl = "http://127.0.0.1:8081/api/v1/";

  constructor(private http: HttpClient) {}

  getLastSpyrecordOfUser(userId: string) {
    return this.http
      .get<Spyrecord>(this.endpointUrl + "user/" + userId, {
        responseType: "json",
      })
      .pipe(
        retry(3), // retry a failed request up to 3 times
        catchError(this.handleError) // then handle the error
      );
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
