FROM node:16 as builder
ARG NPM_TOKEN

WORKDIR /app
COPY . .

RUN rm -f .npmrc
COPY .npmrc.docker .npmrc

RUN rm -f .env
RUN rm -f .env.production

RUN pnpm install
RUN pnpm build


FROM node:alpine

WORKDIR /app
COPY --from=builder /app .

RUN apk add --no-cache python3 py3-pip ffmpeg

CMD ["pnpm", "start:prod"]