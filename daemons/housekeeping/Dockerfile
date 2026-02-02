FROM node:24-trixie-slim

ARG ENV

WORKDIR /usr/src/fails

COPY package-lock.json ./ 
COPY daemons/housekeeping/package*.json ./daemons/housekeeping/
COPY .npmrc ./

#debug
RUN --mount=type=secret,id=GH_TOKEN export GH_TOKEN=`cat /run/secrets/GH_TOKEN`; if [ "$ENV" = "debug" ] ; then npm install ; else  npm ci --only=production; fi

COPY daemons/housekeeping ./daemons/housekeeping

WORKDIR /usr/src/fails/daemons/housekeeping

EXPOSE 8080

CMD [ "node", "src/main.js" ]
