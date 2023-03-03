# Fitness

- [Fitness](#fitness)
  - [Development](#development)
    - [Quickstart](#quickstart)
    - [Production build](#production-build)
  - [License](#license)

## Development

### Quickstart

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

# Run it (if you have previously started the development container, halt it!)
docker run -e PROXY_MODE=1 -p 8080:8080 <your-image-tag>
# now available at http://localhost:8080
```

The final image is based on a minimal container image that runs rootless.

## License
(c) fuccac
