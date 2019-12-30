// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiHost: 'http://api.local.tutorbits.com:5000',
  // tslint:disable-next-line: max-line-length
  loginUrl: 'https://login.tutorbits.com/oauth2/authorize?client_id=60bttusi8qioo53pfnqtgqcn4s&response_type=code&scope=email+openid+aws.cognito.signin.user.admin&redirect_uri=https://local.tutorbits.com/login',
  logoutUrl: 'https://login.tutorbits.com/logout?client_id=60bttusi8qioo53pfnqtgqcn4s&logout_uri=https://local.tutorbits.com/logout',
  loginTokenUrl: 'https://login.tutorbits.com/oauth2/token',
  loginClientId: '60bttusi8qioo53pfnqtgqcn4s',
  loginRedirectUri: 'https://local.tutorbits.com/login',
  logoutRedirectUri: 'https://local.tutorbits.com/logout',
  loggingEnabled: true,
  loggingTraceEnabled: false,
  mouseAccurracyMS: 100,
  scrollAccurracyMS: 0,
  envName: 'default',
  allowCreate: true
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
