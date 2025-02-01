# Flexatar Virtual Webcam

## The Brief Introduction

Our product enables to animate audio on the fly *(1)* in a browser *(2)* with your personal 3D model *(3)* called flexatar.

This means

1. Animating in **real-time** enables you to implant flexatars to any service, from WebRTC online meetings to chatbots with AI
2. The capability to run on the device makes **scaling** trivial and eliminates the need for GPU-powered backend
3. Your customers can easily make 3D models by their own, and it takes about 15 seconds

Last but not least, we are provideing effects like mixing different models and introducing emotions

[![Webradio Animation Screenshot](screenshot1.jpg)](https://www.flexatar-sdk.com/demo)

[Please take a look at our demo](https://www.flexatar-sdk.com/demo) to get an idea how it looks. It makes sense to start with **Web Radio** App.


## Integration

To make integration super easy, we prepared 3 i-frames for different scenarios, and an example of server-side integration with out backend.

### Making short videos
[Video I-frame]() can be placed in your webpage to let your users create short videos with full control over effects.

### Building personal assistants and AI talking frontends
[Assistant I-frame]() is used to make your flexatar speak like a human. You can easily decorate it with your style integrate it with TTS engine of your choice

### WebRTC Virtual Web Camera
The most unique product, [WebRTC virtual web camera I-frame]() can be easily embedded in your WebRTC frontend, adding a new vitrual capturing device, alongside with physical webcams. All you need is to supply the i-frame with audio stream, and it will return (audio+video) streams back, with respect of lipsync with neiglible delay

### Interfacing our backend
All out I-frames from above are interworing with our backend. Our customers are getting Secrets from us, that enables them to request Tokens to serve their end-users.

We are also providing test access to help our customers tune interfacing with both our backend and end-users. 

The node.js example of customer-side backend can be found [here]()

The terms of use are presented at [our website](https://flexatar.com)


## Under the hood

Flexatar technology comprises the following:

- Our unique proprietary algorithm to **create** truely 3D **flexatars** from photo(s) or videos (for enchanced version). Computing is performed on our backend, and it takes about 15 seconds. 

![Virtual Webcam with Flexatar](flexatarSDK.jpg)

- In-browser real-time **animation** of 3D flexatars with effects. The tiny delay is introduced to compute *phoneme* animation, that is combined with *animtion patterns* making flexatars look alive. Flexatar applied for animating can be either original one or a morph of flexatars with emotions and effects which are controlled by a user. The animaton delay is a compromise between an adequate voice-driven animation and the processing duration. To compensate such a delay and ensure lipsync, the delayed audio track is provided alongside with video.

Flexatars are created and stored in our AWS-hosted backend, being supplied to a browser directly.
Our customer is expected to request Tokens per user session from backend by Secret. These Tokens are used to account end-users activities. 

## Commercial

<ToDo>