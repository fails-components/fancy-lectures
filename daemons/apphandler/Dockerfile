FROM node:24-trixie-slim

ARG ENV

WORKDIR /usr/src/fails

COPY package-lock.json ./ 
COPY daemons/apphandler/package*.json ./daemons/apphandler/
COPY .npmrc ./

#debug
RUN --mount=type=secret,id=GH_TOKEN export GH_TOKEN=`cat /run/secrets/GH_TOKEN`; if [ "$ENV" = "debug" ] ; then npm install ; else  npm ci --only=production; fi

COPY daemons/apphandler ./daemons/apphandler

WORKDIR /usr/src/fails/daemons/apphandler

EXPOSE 8080

VOLUME ["/usr/src/fails/daemons/apphandler/files"]

CMD [ "node", "src/server.js" ]
