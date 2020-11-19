FROM node:14.8.0 AS build

ENV NODE_ENV=development

WORKDIR /app

COPY package.json ./
COPY yarn.lock ./
COPY ./packages/migration/ ./packages/migration/


RUN yarn --cwd ./packages/migration build

FROM node:14.8.0-alpine

WORKDIR /app

COPY --from=build /app/package.json /app/yarn.lock ./
COPY --from=build /app/packages/migration/package.json ./packages/migration/
COPY --from=build /app/packages/migration/dist/ ./packages/migration/dist/
COPY --from=build /app/packages/migration/node_modules/ ./packages/migration/node_modules/


RUN chmod +x ./packages/migration/dist/runCli.js

ENTRYPOINT ["node", "--unhandled-rejections=strict" ,"/app/packages/migration/dist/runCli.js"]