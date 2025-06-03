FROM node:20.10.0

WORKDIR /app


COPY ./src/util/ src/util/
COPY ./src/flexatar-package/src/ src/flexatar-package/src/

# lens
COPY ./src/ftar-lens/package.json src/ftar-lens/package.json
COPY ./src/ftar-lens/webpack.config.js src/ftar-lens/webpack.config.js
COPY ./src/ftar-lens/dist/face-detection-asset/ src/ftar-lens/dist/face-detection-asset/
COPY ./src/ftar-lens/dist/index.html src/ftar-lens/dist/index.html
COPY ./src/ftar-lens/dist/style.css src/ftar-lens/dist/style.css
COPY ./src/ftar-lens/src/ src/ftar-lens/src/
RUN cd src/ftar-lens && npm install && npm run build

#progress

COPY ./src/ftar-progress/package.json src/ftar-progress/package.json
COPY ./src/ftar-progress/webpack.config.js src/ftar-progress/webpack.config.js
COPY ./src/ftar-progress/dist/index.html src/ftar-progress/dist/index.html
COPY ./src/ftar-progress/dist/style.css src/ftar-progress/dist/style.css
COPY ./src/ftar-progress/src/ src/ftar-progress/src/
RUN cd src/ftar-progress && npm install && npm run build

#ui min
COPY ./src/vcam-ui-min/package.json src/vcam-ui-min/package.json
COPY ./src/vcam-ui-min/webpack.config.js src/vcam-ui-min/webpack.config.js
COPY ./src/vcam-ui-min/dist/res/ src/vcam-ui-min/dist/res/
COPY ./src/vcam-ui-min/dist/index.html src/vcam-ui-min/dist/index.html
COPY ./src/vcam-ui-min/src/ src/vcam-ui-min/src/
RUN cd src/vcam-ui-min && npm install && npm run build


# v-gen iframe controller
COPY ./src/v-gen-lib/package.json src/v-gen-lib/package.json
COPY ./src/v-gen-lib/webpack.config.js src/v-gen-lib/webpack.config.js
COPY ./src/v-gen-lib/src/ src/v-gen-lib/src/
RUN cd src/v-gen-lib && npm install && npm run build

# v-gen iframe 
COPY ./src/v-gen-iframe/package.json src/v-gen-iframe/package.json
COPY ./src/v-gen-iframe/webpack.config.js src/v-gen-iframe/webpack.config.js
COPY ./src/v-gen-iframe/src/ src/v-gen-iframe/src/
COPY ./src/v-gen-iframe/dist/ src/v-gen-iframe/dist/
RUN cd src/v-gen-iframe && npm install && npm run build 

# vcam-interface 
COPY ./vcam-interface/package.json vcam-interface/package.json
COPY ./vcam-interface/vite.config.js vcam-interface/vite.config.js
COPY ./vcam-interface/src/ vcam-interface/src/
COPY ./vcam-interface/public/ vcam-interface/public/
COPY ./vcam-interface/index.html vcam-interface/index.html
RUN cd vcam-interface && npm install && npm run build 


# Demo Web App (integration sample)
COPY ./src/server/package.json src/server/package.json
COPY ./src/server/handlers.js src/server/handlers.js
COPY ./src/server/server.js src/server/server.js
COPY ./src/server/webpack.config.js src/server/webpack.config.js
COPY ./src/server/src/ src/server/src/
COPY ./src/server/dist/ src/server/dist/
RUN cd src/server && npm install && npm run build 



EXPOSE 8081

CMD [ "node", "src/server/server.js" ]