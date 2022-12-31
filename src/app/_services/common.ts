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
  