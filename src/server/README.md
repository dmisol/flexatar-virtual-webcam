# Flexatar Demo Server

This demo server shows the way how to integrate with Flexatar API. Allows to handle your subscriptions and flexatars.

## Quick start 


- Obtain **FLEXATAR_API_SECRET** from [Flexatar Web Page](https://flexatar-sdk.com).
- Create .env file "flexatar-demo.env" with content FLEXATAR_API_SECRET=`<your api key>`
- Edit run-server.sh or run-docker.sh to link your .env file

Deploy a local demo web app showcasing integration with the Flexatar SDK.

### With Bash Script 

 Install [Node.js](https://nodejs.org/en/download)
  ``` 
  ./run-server.sh
  ```
  > Note: On windows use `Git Bash` to run script.
  
### Or With Docker 

 Install [Docker](https://docs.docker.com/engine/install/)

  ``` 
  ./run-docker.sh
  ```

 
Visit the demo server in your browser at: [localhost:8081/main](http://localhost:8081/main)




## Examples
 Find how to use flexatar SDK on the front end in:
 ```
 src/vcam-creator.js
 src/vgen-creator.js
 ```
[vcam-creator.js](./src/vcam-creator.js)

[vgen-creator.js](./src/vgen-creator.js)

 Find how to interact with our API on backend in:
 ```
handlers.js
 ```

 [handlers.js](./handlers.js)

