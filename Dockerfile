### -----------------------
# --- Stage: development
# --- Purpose: Local dev environment (no application deps)
### -----------------------
FROM node:18-bullseye AS development

# Replace shell with bash so we can source files
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

# Set debconf to run non-interactively
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections

# Install base dependencies 
RUN apt-get update && apt-get install -y -q --no-install-recommends \
    apt-transport-https \
    build-essential \
    ca-certificates \
    curl \
    git \
    libssl-dev \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

### -----------------------
# --- Stage: builder
# --- Purpose: Installs application deps and builds the service
### -----------------------

FROM development AS builder

# install server and bundler deps
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
RUN npm install

# copy in all workspace files
COPY . /app/

### -----------------------
# --- Stage: production
# --- Purpose: Final step from a new slim image. this should be a minimal image (production service)
### -----------------------

FROM node:18-alpine AS production

# https://github.com/nodejs/docker-node/blob/7de353256a35856c788b37c1826331dbba5f0785/docs/BestPractices.md
# Node.js was not designed to run as PID 1 which leads to unexpected behaviour when running inside of Docker. 
# You can also include Tini directly in your Dockerfile, ensuring your process is always started with an init wrapper.
RUN apk add --no-cache tini

USER node
WORKDIR /app

# copy only required files
COPY --chown=node:node --from=builder /app/client /app/client
COPY --chown=node:node --from=builder /app/node_modules /app/node_modules
# COPY --chown=node:node --from=builder /app/saves/config/achievementList.json /app/saves/config/achievementList.json
COPY --chown=node:node --from=builder /app/server /app/server
COPY --chown=node:node --from=builder /app/app.js /app/app.js

# ENV defaults
ENV NODE_ENV=production
ENV PROXY_MODE=1
# ENV DB_TOKEN=
# ENV GAGS_USERNAME=
# ENV GAGS_PASSWORD=

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node","app.js"]