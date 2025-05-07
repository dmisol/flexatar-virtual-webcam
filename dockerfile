FROM node:20.10.0

WORKDIR /app


COPY ./src/util/ util/
COPY ./src/flexatar-package/src/ flexatar-package/src/

# lens
COPY ./src/ftar-lens/package.json ftar-lens/package.json
COPY ./src/ftar-lens/webpack.config.js ftar-lens/webpack.config.js
COPY ./src/ftar-lens/dist/face-detection-asset/ ftar-lens/dist/face-detection-asset/
COPY ./src/ftar-lens/dist/index.html ftar-lens/dist/index.html
COPY ./src/ftar-lens/src/ ftar-lens/src/
RUN cd ftar-lens && npm install && npm run build

#progress

COPY ./src/ftar-progress/package.json ftar-progress/package.json
COPY ./src/ftar-progress/webpack.config.js ftar-progress/webpack.config.js
COPY ./src/ftar-progress/dist/index.html ftar-progress/dist/index.html
COPY ./src/ftar-progress/src/ ftar-progress/src/
RUN cd ftar-progress && npm install && npm run build

#ui min
COPY ./src/vcam-ui-min/package.json vcam-ui-min/package.json
COPY ./src/vcam-ui-min/webpack.config.js vcam-ui-min/webpack.config.js
COPY ./src/vcam-ui-min/dist/res/ vcam-ui-min/dist/res/
COPY ./src/vcam-ui-min/dist/index.html vcam-ui-min/dist/index.html
COPY ./src/vcam-ui-min/src/ vcam-ui-min/src/
RUN cd vcam-ui-min && npm install && npm run build


# v-gen iframe controller
COPY ./src/v-gen-lib/package.json v-gen-lib/package.json
COPY ./src/v-gen-lib/webpack.config.js v-gen-lib/webpack.config.js
COPY ./src/v-gen-lib/src/ v-gen-lib/src/
RUN cd v-gen-lib && npm install && npm run build

# v-gen iframe 
COPY ./src/v-gen-iframe/package.json v-gen-iframe/package.json
COPY ./src/v-gen-iframe/webpack.config.js v-gen-iframe/webpack.config.js
COPY ./src/v-gen-iframe/src/ v-gen-iframe/src/
COPY ./src/v-gen-iframe/dist/ v-gen-iframe/dist/
RUN cd v-gen-iframe && npm install && npm run build 


# Demo Web App (integration sample)
COPY ./src/server/package.json server/package.json
COPY ./src/server/handlers.js server/handlers.js
COPY ./src/server/server.js server/server.js
COPY ./src/server/webpack.config.js server/webpack.config.js
COPY ./src/server/src/ server/src/
COPY ./src/server/dist/ server/dist/
RUN cd server && npm install && npm run build 



EXPOSE 8081

CMD [ "node", "server/server.js" ]