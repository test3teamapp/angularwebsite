// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular-cli.json`.

export const environment = {
  production: false,
  wsEndpoint: 'ws://localhost:8081/api/v1/ws',
  firebaseServerEndpointUrl: 'https://127.0.0.1:8082/api/v1/',
  endpointUrl: "https://127.0.0.1:8081/api/v1/",
  reconnectInterval: 2000
};
