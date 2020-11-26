FROM node:12.16.2-alpine as deps

WORKDIR /opt/app

RUN apk add --no-cache --update bash curl

COPY package.json .
COPY yarn.lock .

RUN ls .

# --ignore-scripts is used in order not to run `yarn prepare`
RUN yarn install --ignore-scripts

RUN ls ./node_modules/.bin
RUN pwd

COPY . .

RUN ls -al .

RUN yarn build

ENV NODE_ENV=production

ENTRYPOINT ["node", "dist/runCli.js"]
CMD []