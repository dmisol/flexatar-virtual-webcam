cd ./src/vcam-ui-min/ && npm install && npm run build && cd -
cd ./src/ftar-lens/ && npm install && npm run build && cd -
cd ./src/ftar-progress/ && npm install && npm run build && cd -
cd ./src/ftar-effect/ && npm install && npm run build && cd -

cd ./src/v-gen-lib/ && npm install && npm run build && cd -
cd ./src/v-gen-iframe/ && npm install && npm run build && cd -
cd ./vcam-interface/ && npm install && npm run build && cd -

cd ./src/server/ && npm install && npm run build && cd -
cp ./.env ./src/server/.env

echo "Available at: http://localhost:8081/main/"
cd ./src/server/ && node server.js