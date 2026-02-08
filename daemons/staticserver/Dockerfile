ARG DAEMON_NAME=staticserver
ARG ENV
ARG STATIC_SERVER_WORK=/usr/src/fails/daemons/staticserver
ARG BASE_WORK=/usr/src/fails

FROM node:24-trixie-slim AS build-stage
ARG ENV
ARG DAEMON_NAME
WORKDIR /usr/src/fails

COPY . .

RUN --mount=type=secret,id=GH_TOKEN export GH_TOKEN=`cat /run/secrets/GH_TOKEN`;\
       npx update-browserslist-db@latest
RUN --mount=type=secret,id=GH_TOKEN export GH_TOKEN=`cat /run/secrets/GH_TOKEN`;\
      npm ci --only=production 
#build the app
ARG BASE_WORK
WORKDIR ${BASE_WORK}/node_modules/@fails-components/appstable
RUN mkdir -p ${BASE_WORK}/node_modules/@fails-components/appstable/node_modules -p \
        && mv ${BASE_WORK}/node_modules/@fails-components/appexperimental/public/iconexp.svg \
              ${BASE_WORK}/node_modules/@fails-components/appexperimental/public/icon.svg \
        && ln -s ${BASE_WORK}/node_modules/qr-scanner \
           ${BASE_WORK}/node_modules/@fails-components/app/node_modules/qr-scanner
RUN export REACT_APP_VERSION=$(npm pkg get version | sed 's/"//g'); \
    export REACT_APP_JUPYTER_PROXY_DOMAINS="pypi.org files.pythonhosted.org cdn.jsdelivr.net raw.githubusercontent.com repo.prefix.dev shards.prefix.dev prefix.dev";\
    npm run build
# build the experimental app
WORKDIR ${BASE_WORK}/node_modules/@fails-components/appexperimental
RUN mkdir -p ${BASE_WORK}/node_modules/@fails-components/appexperimental/node_modules -p \
    && mv ${BASE_WORK}/node_modules/@fails-components/lectureappexperimental/public/iconexp.svg \
          ${BASE_WORK}/node_modules/@fails-components/lectureappexperimental/public/icon.svg \
    && ln -s ${STATIC_SERVER_WORK}/node_modules/qr-scanner \
          ${BASE_WORK}/node_modules/@fails-components/appexperimental/node_modules/qr-scanner \
    && ln -s ${STATIC_SERVER_WORK}/node_modules/libav.js \
         ${BASE_WORK}/node_modules/@fails-components/lectureappexperimental/node_modules/libav.js \
    && ln -s ${STATIC_SERVER_WORK}/node_modules/pdfjs-dist \
           ${BASE_WORK}/node_modules/@fails-components/lectureappexperimental/node_modules/pdfjs-dist \ 
    && ln -s ${STATIC_SERVER_WORK}/node_modules/libavjs-webcodecs-polyfill \
           ${BASE_WORK}/node_modules/@fails-components/lectureappexperimental/node_modules/libavjs-webcodecs-polyfill \
    && mkdir -p ${BASE_WORK}/node_modules/@fails-components/lectureappexperimental/node_modules/@mediapipe \
    && ln -s ${STATIC_SERVER_WORK}/node_modules/@mediapipe/tasks-vision \
           ${BASE_WORK}/node_modules/@fails-components/lectureappexperimental/node_modules/@mediapipe/tasks-vision \
    && ln -s ${STATIC_SERVER_WORK}/node_modules/libav.js \
          ${BASE_WORK}/node_modules/@fails-components/lectureappstable/node_modules/libav.js \
    && ln -s ${STATIC_SERVER_WORK}/node_modules/pdfjs-dist \
           ${BASE_WORK}/node_modules/@fails-components/lectureappstable/node_modules/pdfjs-dist \ 
    && ln -s ${STATIC_SERVER_WORK}/node_modules/libavjs-webcodecs-polyfill \
         ${BASE_WORK}/node_modules/@fails-components/lectureapp/node_modules/libavjs-webcodecs-polyfill \
    && mkdir -p ${BASE_WORK}/node_modules/@fails-components/lectureapp/node_modules/@mediapipe \
    && ln -s ${STATIC_SERVER_WORK}/node_modules/@mediapipe/tasks-vision \
         ${BASE_WORK}/node_modules/@fails-components/lectureapp/node_modules/@mediapipe/tasks-vision
RUN export REACT_APP_VERSION=$(npm pkg get version | sed 's/"//g');\
    export PUBLIC_URL=/static/experimental/app/;\
    export REACT_APP_JUPYTER_PROXY_DOMAINS="pypi.org files.pythonhosted.org cdn.jsdelivr.net raw.githubusercontent.com repo.prefix.dev shards.prefix.dev prefix.dev";\
    npm run build
#build the lectureapp
WORKDIR ${BASE_WORK}/node_modules/@fails-components/lectureappstable
RUN export REACT_APP_VERSION=$(npm pkg get version | sed 's/"//g'); \
    export REACT_APP_JUPYTER_PROXY_DOMAINS="pypi.org files.pythonhosted.org cdn.jsdelivr.net raw.githubusercontent.com repo.prefix.dev shards.prefix.dev prefix.dev";\
    npm run build
#build the experimental lectureapp
WORKDIR ${BASE_WORK}/node_modules/@fails-components/lectureappexperimental
RUN export REACT_APP_VERSION=$(npm pkg get version | sed 's/"//g'); \
    export PUBLIC_URL=/static/experimental/lecture/;\
    export REACT_APP_JUPYTER_PROXY_DOMAINS="pypi.org files.pythonhosted.org cdn.jsdelivr.net raw.githubusercontent.com repo.prefix.dev shards.prefix.dev prefix.dev";\
    npm run build
ARG STATIC_SERVER_WORK
WORKDIR ${BASE_WORK}
RUN mkdir -p ${STATIC_SERVER_WORK}/oss-attribution
RUN npx generate-license-file --input ./package.json --output ${BASE_WORK}/daemons/staticserver/oss-attribution/attribution.txt

FROM node:24-trixie-slim AS jupyter-build

RUN apt-get update -y && apt-get upgrade -y && apt-get install -y git pipx wget

RUN mkdir -p ~/miniconda3 && \
    wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda3/miniconda.sh && \
    bash ~/miniconda3/miniconda.sh -b -u -p ~/miniconda3 &&\
    rm -rf ~/miniconda3/miniconda.sh && \
     ~/miniconda3/bin/conda init bash
RUN ~/miniconda3/bin/conda create -y -n failscomponents --override-channels --strict-channel-priority -c conda-forge -c nodefaults \
    jupyterlab=4.5.1 \
    nodejs=24 \
    git copier=7 jinja2-time \
    jupyterlite-core=0.7.1 \
    jupyterlite-pyodide-kernel=0.7.0 \
    jupyterlite-xeus=4.3.7

RUN ~/miniconda3/bin/conda run -n failscomponents pip install \
    fails-components-jupyter-applet-view==0.0.5 \
    fails-components-jupyter-filesystem-extension==0.0.5 \
    fails-components-jupyter-interceptor==0.0.5 \
    fails-components-jupyter-launcher==0.0.5

WORKDIR /usr/src/jupyterlite/

COPY jupyter/*.yml ./
COPY jupyter/*.json ./
RUN ~/miniconda3/bin/conda run -n failscomponents jupyter lite build


FROM nginx:stable AS staticserver-noassets
ARG BASE_WORK
COPY --from=build-stage ${BASE_WORK}/node_modules/@fails-components/appstable/build/ /usr/share/nginx/html/static/app
COPY --from=build-stage ${BASE_WORK}/node_modules/@fails-components/lectureapp/build/ /usr/share/nginx/html/static/lecture
#workaround to remove old service worker
RUN cp /usr/share/nginx/html/static/lecture/sw.js /usr/share/nginx/html/static/lecture/service-worker.js

COPY --from=build-stage ${BASE_WORK}/node_modules/@fails-components/appexperimental/build/ \
       /usr/share/nginx/html/static/experimental/app
COPY --from=build-stage ${BASE_WORK}/node_modules/@fails-components/lectureappexperimental/build/ \
       /usr/share/nginx/html/static/experimental/lecture
#workaround to remove old service worker
RUN cp /usr/share/nginx/html/static/experimental/lecture/sw.js /usr/share/nginx/html/static/experimental/lecture/service-worker.js
ARG STATIC_SERVER_WORK
COPY --from=build-stage ${STATIC_SERVER_WORK}/oss-attribution/ /usr/share/nginx/html/static/oss/
RUN mkdir -p /usr/share/nginx/html/config
COPY ./daemons/staticserver/nginx.conf.noassets /etc/nginx/templates/default.conf.template
COPY ./daemons/staticserver/40-copy-fails-env.sh /docker-entrypoint.d

RUN echo "pypi.org files.pythonhosted.org cdn.jsdelivr.net raw.githubusercontent.com repo.prefix.dev shards.prefix.dev prefix.dev" | tr ' ' '\n' | sed 's/$/ 1;/' > /etc/nginx/allowed_jupyter_proxy_hosts.conf
COPY --from=jupyter-build /usr/src/jupyterlite/jupyterLiteFailsOut/ /usr/share/nginx/html/jupyter/

FROM nginx:stable
ARG BASE_WORK
COPY --from=build-stage ${BASE_WORK}/node_modules/@fails-components/appstable/build/ /usr/share/nginx/html/static/app
COPY --from=build-stage ${BASE_WORK}/node_modules/@fails-components/lectureapp/build/ /usr/share/nginx/html/static/lecture
#workaround to remove old service worker
RUN cp /usr/share/nginx/html/static/lecture/sw.js /usr/share/nginx/html/static/lecture/service-worker.js

COPY --from=build-stage ${BASE_WORK}/node_modules/@fails-components/appexperimental/build/ /usr/share/nginx/html/static/experimental/app
COPY --from=build-stage ${BASE_WORK}/node_modules/@fails-components/lectureappexperimental/build/ /usr/share/nginx/html/static/experimental/lecture
#workaround to remove old service worker
RUN cp /usr/share/nginx/html/static/experimental/lecture/sw.js /usr/share/nginx/html/static/experimental/lecture/service-worker.js

ARG STATIC_SERVER_WORK
COPY --from=build-stage ${STATIC_SERVER_WORK}/oss-attribution/ /usr/share/nginx/html/static/oss/
RUN mkdir -p /usr/share/nginx/html/config
COPY ./daemons/staticserver/nginx.conf /etc/nginx/templates/default.conf.template
COPY ./daemons/staticserver/40-copy-fails-env.sh /docker-entrypoint.d

RUN echo "pypi.org files.pythonhosted.org cdn.jsdelivr.net raw.githubusercontent.com repo.prefix.dev shards.prefix.dev prefix.dev" | tr ' ' '\n' | sed 's/$/ 1;/' > /etc/nginx/allowed_jupyter_proxy_hosts.conf
COPY --from=jupyter-build /usr/src/jupyterlite/jupyterLiteFailsOut/ /usr/share/nginx/html/jupyter/

VOLUME ["/usr/share/nginx/htmlsecuredfiles"]

