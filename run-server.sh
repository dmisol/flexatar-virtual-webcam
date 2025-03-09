cd ./src/v-cam-lib/ && npm install && npm run build && cd -
cd ./src/v-cam-iframe/ && npm install && npm run build && cd -

cd ./src/v-gen-lib/ && npm install && npm run build && cd -
cd ./src/v-gen-iframe/ && npm install && npm run build && cd -

cd ./src/server/ && npm install && npm run build && cd -

# provide file flexatar-demo.env with FLEXATAR_API_SECRET=<your api secret>
ENV_FILE=../flexatar-demo.env
export $(cat ${ENV_FILE} | xargs)

cd ./src/server/ && node server.js