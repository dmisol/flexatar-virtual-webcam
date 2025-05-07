cd ./src/vcam-ui-min/ && npm install && npm run build && cd -
cd ./src/ftar-lens/ && npm install && npm run build && cd -
cd ./src/ftar-progress/ && npm install && npm run build && cd -

cd ./src/v-gen-lib/ && npm install && npm run build && cd -
cd ./src/v-gen-iframe/ && npm install && npm run build && cd -

cd ./src/server/ && npm install && npm run build && cd -
cp ./env /src/server/.env

cd ./src/server/ && node server.js