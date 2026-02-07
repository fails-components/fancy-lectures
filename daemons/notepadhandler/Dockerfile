ARG DAEMON_NAME=notepadhandler
ARG ENV
FROM node:24-trixie-slim AS prebuilder
ARG DAEMON_NAME
WORKDIR /usr/src/fails
RUN npm install -g isolate-package

COPY . .

COPY .npmrc ./

RUN if [ "$ENV" = "debug" ] ; then \
        npm install --no-workspaces; \
    else  \
        npm ci --only=production --no-workspaces;\
    fi

WORKDIR /usr/src/fails/daemons/${DAEMON_NAME}

RUN npx isolate-package

FROM node:24-trixie-slim
ARG ENV
ARG DAEMON_NAME
WORKDIR /usr/src/fails/daemons/${DAEMON_NAME}
COPY --from=prebuilder /usr/src/fails/daemons/${DAEMON_NAME}/isolate/ ./

RUN if [ "$ENV" = "debug" ] ; then \
        npm install --no-workspaces; \
    else  \
        npm ci --only=production --no-workspaces;\
    fi

EXPOSE 8080

CMD [ "node", "src/server.js" ]
