FROM node:22-trixie-slim

ARG ENV

WORKDIR /usr/src/fails

COPY package-lock.json ./ 
COPY daemons/noteshandler/package*.json ./daemons/noteshandler/
COPY .npmrc ./

#debug
RUN --mount=type=secret,id=GH_TOKEN export GH_TOKEN=`cat /run/secrets/GH_TOKEN`; if [ "$ENV" = "debug" ] ; then npm install ; else  npm ci --only=production; fi

COPY daemons/noteshandler ./daemons/noteshandler

WORKDIR /usr/src/fails/daemons/noteshandler

EXPOSE 8080

CMD [ "node", "src/server.js" ]
