FROM node:alpine

RUN apk add --no-cache python3 py3-pip ffmpeg
RUN npm install -g pnpm

WORKDIR /app

COPY ./package.json .
COPY ./pnpm-lock.yaml .
COPY ./.npmrc.docker ./.npmrc
RUN pnpm install

COPY ./dist ./dist

CMD ["pnpm", "start:prod"]