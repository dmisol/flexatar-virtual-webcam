# Flexatar Demo Server

This demo server shows the way how to integrate with Flexatar API. Allows to handle your subscriptions and flexatars.

## Quick start 
1. Install [Node.js](https://nodejs.org/en/download)
2. Obtain **FLEXATAR_API_SECRET** from [Flexatar Web Page](https://flexatar-sdk.com).
3. Set the Environment Variable

 ```
 #linux
 export FLEXATAR_API_SECRET=your_api_key
 #windows
 set FLEXATAR_API_SECRET=your_api_key
 ```

4. Install Dependencies

 ```
 npm install
 ```

5. Build the Project

 ```
 npm run build
 ```

6. Start the Demo Server

 ```
 npm run start
 ```

 7. Visit the demo server in your browser at: [localhost:8081/main](localhost:8081/main)

 > **Note:** UI for handling "busy state" and error messages has not been implemented.

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

