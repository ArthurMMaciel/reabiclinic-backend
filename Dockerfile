FROM node:18.16.0 as builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:18.16.0

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/src ./src
COPY --from=builder /usr/src/app/credentials.json ./credentials.json

EXPOSE 3000

CMD ["sh", "-c", "node dist/main"]
