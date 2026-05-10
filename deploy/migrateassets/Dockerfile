FROM node:24-trixie-slim

ARG ENV

WORKDIR /usr/src/migrate

COPY package*.json ./

#debug
RUN  npm install 

COPY . .

ENTRYPOINT [ "npm", "run" ]
