# Fitness

Fitness is a small workout tracking application with Microsoft Entra External ID authentication, real-time updates through Socket.IO, and optional Dropbox-backed persistence.

## Local development

### Requirements

- Node.js 22
- npm 10 or newer
- A Microsoft Entra External ID application registration
- A Microsoft Entra sign-up and sign-in user flow
- A Dropbox access token only if Dropbox persistence is enabled

Check the installed versions:

```bash
node --version
npm --version
```

### 1. Clone and install

```bash
git clone <repository-url>
cd Fitness
npm ci
```

### 2. Create the local environment file

Copy the example environment file:

```bash
cp .env.sample .env
```

Open `.env` and configure the values for your local environment.

#### Minimum local dev setup with dropbox persistence

```dotenv
DB_TOKEN=sl.u.dropbox_token_secret
SESSION_COOKIE_SECRET=replace_with_a_secure_random_secret
TOKEN_SECRET=replace_with_exactly_32_characters
MSAL_DOMAIN_NAME=your-entra-domain
MSAL_APP_CLIENT_ID=your-entra-client-id
MSAL_CLIENT_SECRET=your-entra-client-secret
```

`TOKEN_SECRET` must contain exactly 32 characters. Generate secure values with OpenSSL:

```bash
openssl rand -hex 16
```

Use separate generated values for `SESSION_COOKIE_SECRET` and `TOKEN_SECRET`.

Do not commit `.env` or any real secrets to Git.

### Dropbox persistence

#### Without Dropbox

For local development without Dropbox, use additionally:

```dotenv
PROXY_MODE=1
```

In this mode, Dropbox download and upload operations are disabled. Local save files in the `saves/` directory can still be used. `DB_TOKEN` can be ommitted in this case.

### Optional environment variables

```dotenv
DOMAIN=localhost
PUBLIC_CONTACT_EMAIL=mycontact@mail.com
GAGS_USERNAME=your-smtp-username
GAGS_PASSWORD=your-smtp-password
SESSION_COOKIE_NAME=f_s
TOKEN_COOKIE_NAME=f_t
TOKEN_EXPIRATION_TIME_MINUTES=60m
APP_USER_AGENT_STRING=your-mobile-app-user-agent
SOCKET_ALLOWED_ORIGINS=http://localhost:2000,https://example.com/
SIGN_UP_SIGN_IN_FLOW=SignUpSignInFlow
REDIRECT_URI=http://localhost:2000/auth/callback
POST_LOGOUT_REDIRECT_URI=http://localhost:2000/
```

`DOMAIN` uses localhost as default. For production make sure to set the correct domain, but can be ommited for local development.

`PUBLIC_CONTACT_EMAIL` is the contact email for legal (impressum).

`GAGS_USERNAME` and `GAGS_PASSWORD` are only required for email notifications.

`SESSION_COOKIE_NAME` and `TOKEN_COOKIE_NAME` can be used to set the name of the cookie in the browser, also optional and falls back otherwise.

`TOKEN_EXPIRATION_TIME_MINUTES` controls expiration value of the id token, per default in entra id this rotates every 60 minutes which is why the default is '60m'.

`APP_USER_AGENT_STRING` is only required when detecting requests from a Capacitor/mobile application.

`SOCKET_ALLOWED_ORIGINS` may contain multiple comma-separated origins:

```dotenv
SOCKET_ALLOWED_ORIGINS=http://localhost:2000,http://localhost:8100
```

`SIGN_UP_SIGN_IN_FLOW` is a string to represent the login flow - usually it is good practice to set it to the flow name inside Entra ID, but not a must.

`REDIRECT_URI` and `POST_LOGOUT_REDIRECT_URI` control where entra redirects after authentication actions. Make sure to register the urls also in the Entra ID dashboard. Per default localhost uris are used.

### 3. Start the application

```bash
npm start
```

Open the application in your browser:

```text
http://localhost:2000
```

### Local troubleshooting

- If the application exits immediately, check the required Entra, session, and token environment variables.
- If Dropbox is enabled, also check `DB_TOKEN` and `PROXY_MODE`.
- If login redirects to the wrong location, compare the Entra redirect URI with `REDIRECT_URI` character by character.
- If Socket.IO cannot connect, make sure the browser origin is included in `SOCKET_ALLOWED_ORIGINS`.
- Use exactly `http://localhost:2000` in the browser and avoid mixing `localhost` with `127.0.0.1`.
- If authentication cookies are not stored, check the browser's cookie settings and make sure the local URL matches the configured origin.
- If old user data is expected, make sure the relevant local or Dropbox save files are available before starting the application.

## Production

The production Docker instructions are kept separately below this section.

Production deployments must provide all required environment variables at runtime and must configure:

- Persistent application data
- Dropbox access, if enabled
- Regular backups
- HTTPS
- Production Entra redirect and logout URLs
- The correct production Socket.IO origins

ℹ️❗️ The application currently assumes a single running instance because application state and the authentication token cache are held in memory. ℹ️❗️

### Docker/Kubernetes Setup

#### Quickstart

Do this to setup a development environment:

```bash
# copy the .env.sample to .env and set your values

# Start up the development docker container (multistage Dockerfile, stage 1 only)
./docker-helper.sh --up
# node@3b506a285f7f:/app$

# within this development container:
node$ npm install

# start development server
node$ npm start
# now available at http://localhost:2000
```

### Production build

If you want to build and run your own **production** container locally:

```bash
# Build the production docker container (final stage)
docker build . -t <your-image-tag>

# Run it with runtime configuration (if you have previously started the development container, halt it!)
docker run --env-file .env -e PROXY_MODE=1 -p 8080:8080 <your-image-tag>
# now available at http://localhost:8080
```

The final image is based on a minimal container image that runs rootless.

## License

(c) fuccac
