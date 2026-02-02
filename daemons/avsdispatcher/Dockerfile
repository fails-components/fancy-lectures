FROM node:22-trixie-slim

ARG ENV

WORKDIR /usr/src/fails

COPY package-lock.json ./ 
COPY daemons/avsdispatcher/package*.json ./daemons/avsdispatcher/
COPY .npmrc ./

#debug
RUN --mount=type=secret,id=GH_TOKEN export GH_TOKEN=`cat /run/secrets/GH_TOKEN`; if [ "$ENV" = "debug" ] ; then npm install ; else  npm ci --only=production; fi

COPY daemons/avsdispatcher ./daemons/avsdispatcher

WORKDIR /usr/src/fails/daemons/avsdispatcher

EXPOSE 8080

CMD [ "node", "src/server.js" ]
