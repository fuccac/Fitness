// @ts-check
/*jshint esversion: 6 */

var fetch = require('isomorphic-fetch');
var AuthConfig = require('./authConfig');
var msal = require('@azure/msal-node');

class AuthProvider {
    TOKEN_NAME = 'MSAL_TOKEN_MICROSOFT_ENTRA_EXTERNAL_ID';
    _cryptoProvider = new msal.CryptoProvider();
    _config = new AuthConfig();

    constructor() {
        this._confidentialClient = new msal.ConfidentialClientApplication(this._config.confidentialClient);
    }

    async receiveAuthorityMetaData() {
        const authorityMetadata = await this._getAuthorityMetadata();
        if (authorityMetadata) {
            this._config.confidentialClient.auth.authorityMetadata = JSON.stringify(authorityMetadata);
            this._confidentialClient = new msal.ConfidentialClientApplication(this._config.confidentialClient);
        }
    }

    async getAuthUrl(request, state = {}, authCodeUrlRequestParams = {}, authCodeRequestParams = {}) {
        if (!this._config.confidentialClient.auth.authorityMetadata) {
            await this.receiveAuthorityMetaData();
        }
        
        await this._setRequestAuthValues(request, 
                        {
                ...authCodeUrlRequestParams,
                redirectUri: this._config.redirectURI,
                state: this.base64Encode(JSON.stringify(state))
            },
            { ...authCodeRequestParams, redirectUri: this._config.redirectURI, code: '' },
        );

        return await this._getAuthCodeUrl(request, state.nonce);
    }

    async _setRequestAuthValues(request, authCodeUrlRequest = {}, authCodeRequest = {}) {
        // Generate PKCE Codes before starting the authorization flow
        const { verifier, challenge } = await this._cryptoProvider.generatePkceCodes();

        // Set generated PKCE codes and method as session vars
        request.session.pkceCodes = {
            challengeMethod: 'S256',
            verifier: verifier,
            challenge: challenge,
        };
        request.session.authCodeUrlRequest = {
            ...authCodeUrlRequest,             
            responseMode: 'form_post', // recommended for confidential clients
            codeChallenge: request.session.pkceCodes.challenge,
            codeChallengeMethod: request.session.pkceCodes.challengeMethod,
        };
        request.session.authCodeRequest = authCodeRequest;
    }

    async _getAuthCodeUrl(request, nonce = '') {
        try {
            const authCodeUrlResponse = await this._confidentialClient.getAuthCodeUrl(request.session.authCodeUrlRequest);
            const authCodeUrlResponseObject = new URL(authCodeUrlResponse);
            authCodeUrlResponseObject.searchParams.set('nonce', nonce);
            return authCodeUrlResponseObject.toString();
        } catch(e) {
            console.error(e);
            return '';
        }
    }

    /**
     * Retrieves oidc metadata from the openid endpoint
     * @returns
     */
    async _getAuthorityMetadata() {
        try {
            const response = await fetch(this._config.openIdConnectInfoURI);

            if (!response.ok) {
                throw new Error("Failed to fetch authority meta data...");
            }

            return await response.json();
        } catch (error) {
            console.error(error);
            return undefined;
        }
    }

    guid() {
        return this._cryptoProvider.createNewGuid();
    }

    base64Encode(par = '') {
        return this._cryptoProvider.base64Encode(par);
    }

    base64Decode(par = '') {
        return this._cryptoProvider.base64Decode(par)
    }

    get config() {
        return this._config;
    }

    get confidentialClient() {
        return this._confidentialClient;
    }

    async login(request, code = '', decodedState = {}) {
        try {
            const authCodeRequest = request.session.authCodeRequest;
            if (!authCodeRequest) {
                throw new Error('session for auth code request got lost...', {
                    cause: {
                        stage: decodedState.stage,
                        isApp: decodedState.isApp
                    }
                });
            }

            authCodeRequest.code = code;
            authCodeRequest.codeVerifier = request.session.pkceCodes.verifier;

            this._confidentialClient.getTokenCache().deserialize(request.session.tokenCache);
            const tokenResponse = await this._confidentialClient.acquireTokenByCode(authCodeRequest, request.body);
            request.session.tokenCache = this._confidentialClient.getTokenCache().serialize();
            return tokenResponse;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async logout(request, response) {
        response.clearCookie(this._config.tokenCookieName, {
            path: '/'
        });

        await new Promise((resolve, reject) => {
            request.session.destroy(err => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(undefined);
            });
        });

        const logoutUri =
            `${this._config.confidentialClient.auth.authority}` +
            `${this._config.tenantSubdomain}.onmicrosoft.com` +
            `/oauth2/v2.0/logout` +
            `?post_logout_redirect_uri=${encodeURIComponent(
                this._config.postLogoutURI
            )}`;

        return logoutUri;
    }

    async refresh(request, accountId = '') {
        this._confidentialClient.getTokenCache().deserialize(request.session.tokenCache);
        const cache = this._confidentialClient.getTokenCache();
        cache.deserialize(request.session.tokenCache);
        const account = await cache.getAccountByHomeId(accountId);

        if (!account) {
            throw new Error('no account in memory');
        }

        const silentRequest = {
            account,
            scopes: ["profile", "openid", "email", "User.Read"],
            forceRefresh: true
        };

        const tokenResponse = await this._confidentialClient.acquireTokenSilent(silentRequest);
        request.session.tokenCache = this._confidentialClient.getTokenCache().serialize();
        return tokenResponse;
    }
}

module.exports = AuthProvider;
