FROM node:20.10.0

WORKDIR /app


COPY ./src/util/ util/

# v-cam iframe controller
COPY ./src/v-cam-lib/package.json v-cam-lib/package.json
COPY ./src/v-cam-lib/webpack.config.js v-cam-lib/webpack.config.js
COPY ./src/v-cam-lib/src/ v-cam-lib/src/
RUN cd v-cam-lib && npm install && npm run build

# v-cam iframe 
COPY ./src/v-cam-iframe/package.json v-cam-iframe/package.json
COPY ./src/v-cam-iframe/webpack.config.js v-cam-iframe/webpack.config.js
COPY ./src/v-cam-iframe/src/ v-cam-iframe/src/
COPY ./src/v-cam-iframe/dist/ v-cam-iframe/dist/
RUN cd v-cam-iframe && npm install && npm run build 

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