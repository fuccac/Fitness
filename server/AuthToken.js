// @ts-check
/*jshint esversion: 6 */

class AuthToken {
    _tokens = new Map();
    _user = null;

    setToken(token = '', data = {}) {
        this._tokens.set(token, data);
    }

    setUser(data = {}, override = false) {
        if (this._user && !override) {
            throw new Error('user data was already set, can not overwrite withput force flag');
        }
        this._user = data;
    }

    getUser() {
        return this._user;
    }

    isValid() {
        return !!this._tokens.size && !!this._user && Object.entries(this._user).length > 0 && !!this._user.id && !!this._user.email && !!this._user.userName;
    }

    build() {
        return {
            ...Object.fromEntries(this._tokens),
            user: this._user
        };
    }
}

module.exports = AuthToken;
