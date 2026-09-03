// @ts-check
/*jshint esversion: 6 */

const AuthToken = require('./AuthToken');
const jose = require('jose');
const Config = require('./Config');
const config = new Config();
const { convertExpirationTimeFromMinutesToSeconds, isAppRequest } = require('./helpers');

class AuthService {
    _authProvider;

    constructor(authProvider) {
        this._authProvider = authProvider;
    }

    async callback(request, response, flow = '', code = '', decodedState = {}) {        
        switch(flow) {
            case this._authProvider.config.flows.signUpSignIn: {
                await this.login(request, response, code, decodedState);
                break;
            }
            default: {
                console.warn(`flow=${flow} does not match any callback ...`);
            }
        }
    }

    async login(request, response, code = '', decodedState = {}) {
        const authenticationResult = await this._authProvider.login(request, code, decodedState);

        if (!authenticationResult?.idTokenClaims) {
            throw new Error('No valid authentication result');
        }

        const expectedNonce = request.session.nonce;
        const receivedNonce = authenticationResult.idTokenClaims.nonce;

        if (
            !expectedNonce ||
            !receivedNonce ||
            expectedNonce !== receivedNonce
        ) {
            throw new Error('ID token nonce validation failed');
        }

        // Rotate the session after successful authentication to prevent session fixation.
        // Only retain the MSAL cache needed for silent refresh. Do not carry over the
        // nonce, PKCE values, or authorization request into the authenticated session.
        const tokenCache = request.session.tokenCache;
        await new Promise((resolve, reject) => {
            request.session.regenerate(error => {
                if (error) {
                    reject(error);
                    return;
                }

                if (tokenCache) {
                    request.session.tokenCache = tokenCache;
                }
                resolve();
            });
        });

        await this._createJWETokenCookie(authenticationResult, response, undefined, isAppRequest(request));
    }

    async logout(request, response) {
        return await this._authProvider.logout(request, response);
    }

    async _signJWT(issuer = '', subject = '', tokenPayload = new AuthToken(), type = 'token') {
        const encryptionKey = this.getEncryptionKey();
        const expirationTime = Math.floor(Date.now() / 1000) + convertExpirationTimeFromMinutesToSeconds(this._authProvider.config.tokenExpirationTime);
        const jwtPayload = {
            ...tokenPayload.build(),
            sub: subject,
            iat: Math.floor(Date.now() / 1000),
            exp: expirationTime,
            iss: issuer
        };

        const jsonPayload = Buffer.from(JSON.stringify(jwtPayload), 'utf-8');
        const encrypt = new jose.CompactEncrypt(jsonPayload).setProtectedHeader({ alg: 'dir', enc: 'A256GCM' });
        const jwe = await encrypt.encrypt(encryptionKey);
        return { token: jwe, expiresAt: expirationTime };
    }

    getEncryptionKey() {
        const KEY_LENGTH = 32;
        if (this._authProvider.config.tokenSecret.length !== KEY_LENGTH) {
            throw new Error(`Key length was not ${KEY_LENGTH}!`);
        }
        return new Uint8Array(Buffer.from(this._authProvider.config.tokenSecret, 'utf-8'));
    }

    async decryptJWE(jwe = '') {
        const { plaintext } = await jose.compactDecrypt(
            jwe,
            this.getEncryptionKey()
        );
        const payload = JSON.parse(
            new TextDecoder().decode(plaintext)
        );

        const token = payload[this._authProvider.TOKEN_NAME].token;
        const expiresAt = payload[this._authProvider.TOKEN_NAME].expiresAt;
        const user = payload.user;

        return {
            token,
            expiresAt,
            user
        }
    }

    async validateToken(token = '', expiresAt = 0) {
        if (!this._authProvider.confidentialClient.config.auth?.authorityMetadata) {
            await this._authProvider.receiveAuthorityMetaData();
        }

        let jwksUrl = '';

        try {
            jwksUrl = JSON.parse(this._authProvider.confidentialClient.config.auth?.authorityMetadata).jwks_uri;
        } catch {
            throw new Error('Could not read jwks_url from meta data.', {
                cause: {
                    code: 'ERR_JWKS_META'
                }
            });
        }

        const JWKS = jose.createRemoteJWKSet(new URL(jwksUrl));
        const { payload: jwtVerifyPayload } = await jose.jwtVerify(token, JWKS);

        if (this.isExpired(expiresAt)) {
            throw new Error( 'Token already expired!', {
                cause: {
                    code: 'ERR_JWT_EXPIRED'
                }
            });
        }

        if (!(jwtVerifyPayload.aud && jwtVerifyPayload.aud === this._authProvider.confidentialClient.config.auth?.clientId)) {
            throw new Error('The Token was audited from an unknown clientId!', {
                cause: {
                    code: 'ERR_JWT_AUD'
                }
            });
        }

        if (jwtVerifyPayload.iat && this._getCurrentUnixTimestampInSeconds() < jwtVerifyPayload.iat) {
            throw new Error( 'The Token was issued somewhere in the future!', {
                cause: {
                    code: 'ERR_JWT_IAT'
                }
            });
        }

        if (jwtVerifyPayload.nbf && this._getCurrentUnixTimestampInSeconds() < jwtVerifyPayload.nbf) {
            throw new Error('The Token is not yet valid and can not be used!', {
                cause: {
                    code: 'ERR_JWT_NBF'
                }
            });
        }

        return {
            id: jwtVerifyPayload.sub,
            username: jwtVerifyPayload.name,
            email: jwtVerifyPayload.preferred_username
        };
    }

    _getCurrentUnixTimestampInSeconds() {
        return Number((Date.now() / 1000).toFixed(0));
    }

    isExpired(tokenExpirationInSeconds = null) {
        if (!((tokenExpirationInSeconds ?? Infinity) > this._getCurrentUnixTimestampInSeconds())) {
            return true;
        }
        return false;
    }

    async refreshToken(request, cachedAccountId = '') {
        const authenticationResult = await this._authProvider.refresh(request, cachedAccountId);
        return await this._createJWETokenCookieValue(authenticationResult, cachedAccountId);
    }

    async _createJWETokenCookie(authenticationResult, response, cachedAccountId, isApp = false) {
        const cookieValue = await this._createJWETokenCookieValue(
            authenticationResult,
            cachedAccountId
        );

        this.setAuthCookie(response, cookieValue, isApp);

        return cookieValue;
    }

    async _createJWETokenCookieValue(authenticationResult, cachedAccountId) {
        if (!authenticationResult) {
            throw new Error('Could not acquire token...');
        }

        const { account, idToken, idTokenClaims } = authenticationResult;
        const accountId = cachedAccountId ?? account?.homeAccountId;

        if (!accountId) {
            throw new Error('No MSAL homeAccountId available');
        }

        const authTokenPayload = new AuthToken();
        authTokenPayload.setToken(this._authProvider.TOKEN_NAME, { token: idToken, expiresAt: idTokenClaims.exp });
        authTokenPayload.setUser({
            id: idTokenClaims.sub,
            email: idTokenClaims.preferred_username,
            userName: idTokenClaims.name,
            homeAccountId: accountId
        });

        if (!authTokenPayload.isValid()) {
            throw new Error('invalid auth token payload...');
        }

        const encrypted = {
            token: await this._signJWT(idTokenClaims.iss,'login', authTokenPayload),
            user: authTokenPayload.getUser()
        }

        return encrypted.token.token;
    }

    // save JWE inside a Cookie
    setAuthCookie(res, cookieValue, isApp = false) {
		res.cookie(this._authProvider.config.tokenCookieName, cookieValue, {
            domain: `.${config.DOMAIN}`,
            httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: isApp ? 'none' : 'lax',
			path: '/'
		});
	}
}

module.exports = AuthService;
