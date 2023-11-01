FROM node:alpine
ARG NPM_TOKEN

RUN apk add --no-cache python3 py3-pip ffmpeg
RUN npm install -g pnpm

WORKDIR /app

COPY ./package.json .
COPY ./pnpm-lock.yaml .
COPY ./.npmrc.build ./.npmrc
RUN pnpm install

COPY ./dist ./dist

CMD ["pnpm", "start:prod"]