FROM node:24-trixie-slim

ARG ENV

WORKDIR /usr/src/fails

COPY package-lock.json ./ 
COPY daemons/notepadhandler/package*.json ./daemons/notepadhandler/
COPY .npmrc ./

#debug
RUN --mount=type=secret,id=GH_TOKEN export GH_TOKEN=`cat /run/secrets/GH_TOKEN`; if [ "$ENV" = "debug" ] ; then npm install ; else  npm ci --only=production; fi

COPY daemons/notepadhandler ./daemons/notepadhandler

WORKDIR /usr/src/fails/daemons/notepadhandler

EXPOSE 8080

CMD [ "node", "src/server.js" ]
