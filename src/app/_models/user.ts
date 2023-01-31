export class User {
    id: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    token: string; // random string / loggedout
    chat:string; // online / offline
    expires:string; // "never" / timestamp
}