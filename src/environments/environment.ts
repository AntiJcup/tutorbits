// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiHost: 'http://api.local.tutorbits.com:5000',
  contentHost: 'http://content.tutorbits.com:9001',
  // tslint:disable-next-line: max-line-length
  loginUrl: 'https://login.tutorbits.com/login?client_id=kich757hvogtmieu3rltc7qpu&response_type=token&scope=email+openid&redirect_uri=https://local.tutorbits.com/login'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
