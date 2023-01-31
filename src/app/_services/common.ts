export enum ERROR_MESSAGE {
  TOKEN_NOT_FOUND = "TOKEN NOT FOUND !"
}

export enum Alarmtype {
    NONE = "",
    INFO = "info",
    SUCCESS =  "success",
    WARNING =  "warning",
    DANGER =  "danger"
  }
  
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
  export interface TableData {
    headerRow: string[];
    dataRows: SpyrecordClass[];
  }

  export interface GraphPerson {
    id: number;
    name: string;
  }
  export interface GraphMeeting {
    id: number;
    date: string;
  }
  export interface GraphPlace {
    id: number;
    name: string;
    lng: number;
    lat: number;
  }

  export interface GraphData {
    name:string;
    people: GraphPerson[];
    meeting: GraphMeeting;
    place: GraphPlace;
  }

  export interface GraphCountPlaces {
    name: string;
    place: GraphPlace;
    placeCount: number;
  }

  export interface GraphFofLink {
    friend: string;
    fof: string;
  }

  export interface GraphTreeData {
    name:string;
    friends: string[];
    links: GraphFofLink[];
  }

  export interface LoginCheckData {
    RESULT:string;
    token?:string;
    expires?:string;
  }

  export interface TempLoginData {
    RESULT:string;
    username?:string;
    password?:string;
  }

  export interface SetOnlineStatusResult {
    RESULT:string;
  }

  export interface LoggedinUsersData {
    RESULT:string;
    users?:string[];
  }

  export interface ChatMessage {
    from:string;
    to:string;
    message:string;
    event?:{
      type:string,
      user:string}
  }
  
  
  