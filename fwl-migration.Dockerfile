FROM node:16.15.0-alpine as build

WORKDIR /opt/app

RUN apk add --no-cache --update bash curl

COPY package.json yarn.lock lerna.json ./

COPY packages packages

RUN yarn install

RUN yarn lerna run --scope @fwl/migration build

FROM node:16.15.0-alpine as deps

WORKDIR /opt/app

COPY package.json yarn.lock lerna.json ./

RUN yarn global add lerna

COPY packages packages

RUN lerna bootstrap --include-dependents --include-dependencies --scope @fwl/migration

FROM node:16.15.0-alpine

COPY --from=deps /opt/app/node_modules /opt/app/node_modules
COPY --from=build /opt/app/packages/migration/dist /opt/app/packages/migration/dist

WORKDIR /opt/app/packages/migration

ENTRYPOINT ["node", "dist/runCli.js"]
CMD []
