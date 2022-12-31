import { Injectable } from "@angular/core";

import { Observable, throwError } from "rxjs";
import { catchError, retry } from "rxjs/operators";
import "rxjs/add/operator/toPromise";
import { getJSON } from "@ngui/map/services/util";
import { environment } from '../../environments/environment';
import redisDBclient from '../_models/redisDB_client.js'
import { personRepository } from '../_models/person.js'

const URL_ENDPOINT = environment.endpointUrl;
const URL_ENDPOINT_FIREBASESERVER = environment.firebaseServerEndpointUrl;

import {
  Spyrecord,
  SpyrecordClass,
  Alarmtype
} from "./common";

declare var $: any;

@Injectable()
export class RedisDBService {

  results: SpyrecordClass[];
  loading: boolean;

  constructor(private redisDB: redisDBclient) {
    this.results = [];
    this.loading = false;
  }

  getLastSpyrecordOfUser(userId: string) { // userID is the "name", not the redis record "elementID"

    const person = personRepository.search().where('name').equals(userId).return.first()

    if (person == null) {
      this.handleError(`ERROR: NO PERSON FOUND BY NAME: ${userId}`);
    } else {

      return new SpyrecordClass(
        1,
        person.locationUpdated,
        person.name,
        "{}",
        person.locasion[0],
        person.locasion[1]
      );

    }

  }

  sendCommandToUserDevice(userId: string, command: string) {
    // our client app handles these commands (as keys in the message)
    //mMsgCommandTRIGGERLU := "TRIGGER_LU"
    //mMsgCommandSTARTTRACKING := "START_TRACKING"
    //mMsgCommandSTOPTRACKING := "STOP_TRACKING"


  }

  getSpyrecordOfUserForTimePeriod(userId: string, pastHours: number) {

  }

  getLastSpyrecordsOfUsers(userIds: string) {
    const persons = personRepository.search().return.all()

    if (persons.size() == 0) {
      this.handleError(`ERROR: NO DATA FOR ANY USER`);
    } else {
      //return persons;
      console.log(persons);
      const jsonObj = {};
      let i = 0;
      persons.array.forEach(element => {
        jsonObj[i] = element;
        i++;
      });

      return jsonObj;
    }

  }


  private handleError(erroMsg: String) {
    // return an observable with a user-facing error message
    return throwError(erroMsg);
  }

  showNotification(alarmtype, msg) {

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
