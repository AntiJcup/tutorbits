export const environment = {
  production: true,
  apiHost: 'https://api-staging.tutorbits.com',
  // tslint:disable-next-line: max-line-length
  loginUrl: 'https://login.tutorbits.com/oauth2/authorize?client_id=60bttusi8qioo53pfnqtgqcn4s&response_type=code&scope=email+openid+aws.cognito.signin.user.admin&redirect_uri=https://www-staging.tutorbits.com/login',
  logoutUrl: 'https://login.tutorbits.com/logout?client_id=60bttusi8qioo53pfnqtgqcn4s&logout_uri=https://www-staging.tutorbits.com/logout',
  loginTokenUrl: 'https://login.tutorbits.com/oauth2/token',
  loginClientId: '60bttusi8qioo53pfnqtgqcn4s',
  loginRedirectUri: 'https://www-staging.tutorbits.com/login',
  logoutRedirectUri: 'https://www-staging.tutorbits.com/logout',
  loggingEnabled: true,
  loggingTraceEnabled: false,
  mouseAccurracyMS: 100,
  scrollAccurracyMS: 0,
  envName: 'staging',
  allowCreate: true
};
