export const environment = {
  production: false,
  apiHost: 'https://api.tutorbits.com',
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
  envName: 'local'
};
