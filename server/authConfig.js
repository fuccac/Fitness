// @ts-check
/*jshint esversion: 6 */

const Config = require('./Config');
const Log = require('./Log');
const config = new Config();

const logFile = new Log();

function AuthConfig() {
    if (!process.env.MSAL_APP_CLIENT_ID || !process.env.MSAL_CLIENT_SECRET || !process.env.MSAL_DOMAIN_NAME) {
        console.error("missing entra id env config, exiting...");
        console.error("current entra id config that is set/missing:", {
            MSAL_DOMAIN_NAME: { isSet: !!process.env.MSAL_DOMAIN_NAME },
            MSAL_APP_CLIENT_ID: { isSet: !!process.env.MSAL_APP_CLIENT_ID },
            MSAL_CLIENT_SECRET: { isSet: !!process.env.MSAL_CLIENT_SECRET }
        });
        process.exit(1);
    }

    this.confidentialClient = {
        auth: {
            clientId: process.env.MSAL_APP_CLIENT_ID,
            clientSecret: process.env.MSAL_CLIENT_SECRET,
            authority: `https://${process.env.MSAL_DOMAIN_NAME}.ciamlogin.com/`,
            authorityMetadata: ''
        },
        system: {
            loggerOptions: {
                loggerCallback(_, message = '', containsPii = false) {
                    if (containsPii) {
                        return;
                    }
                    logFile.log(message, true, 0);
                },
                piiLoggingEnabled: false,
            },
        }
    };

    this.flows = {
        signUpSignIn: process.env.SIGN_UP_SIGN_IN_FLOW ?? 'SUSI_DEV_LOCALHOST'
    }; 
    
    if (!process.env.TOKEN_SECRET) {
        console.error("no token cookie secret set, exiting...");
        process.exit(1);
    }
    
    this.tenantSubdomain = process.env.MSAL_DOMAIN_NAME;
    this.tokenSecret = process.env.TOKEN_SECRET;
    this.tokenExpirationTime = process.env.TOKEN_EXPIRATION_TIME_MINUTES ?? '60m';
    this.tokenCookieName = process.env.TOKEN_COOKIE_NAME ?? 'f_t';
    this.redirectURI = process.env.REDIRECT_URI ?? `http://localhost:${process.env.PORT || config.LOCAL_PORT}/auth/callback`;
    this.postLogoutURI = process.env.POST_LOGOUT_REDIRECT_URI ?? `http://localhost:${process.env.PORT || config.LOCAL_PORT}`;
    this.openIdConnectInfoURI = `${this.confidentialClient.auth.authority}${process.env.MSAL_DOMAIN_NAME}.onmicrosoft.com/v2.0/.well-known/openid-configuration`;
}

module.exports = AuthConfig;
