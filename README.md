# Flexatar Virtual Webcam

 **Flexatar Virtual Webcam** is the technology that

1. Creates a 3d model (called **flexatar**) from just a single photo in a few seconds.
2. Animate audio with **flexatar** in **browser (on the device, inc mobile) in hard realtime**
   
![Virtual Webcam with Flexatar](flexatarSDK.jpg)

Our technology is intentionally designed for **WebRTC**!

## Demo
[![Webradio Animation Screenshot](screenshot.png)](https://www.flexatar-sdk.com/demo)

To start with, [PLEASE TAKE A LOOK at our demo](https://www.flexatar-sdk.com/demo) of animating **flexatar** with web radio in your browser.

You can find the preliminary examples [here](examples)

## Scenarios

### Scenario 1: Webrtc Virtual Webcam :microphone:
The key advantage of **flexatar** technique is that it can be used to animate user's audio track from microphone, thus acting as a virtual webcam for **WebRTC**.

We are planning to commit integration examples to leading WebRTC SFU's like Janus, Livekit etc. Feel free to offer candidates.

![WebRTC Virtual Webcam with Flexatar](flexatarVirtualWebcam.jpg)

The procedure is as follows:
1. getUserMedia() with **audio only**
2. audio is delivered to [FlexatarSDK](FlexatarSDK.js)
3. **FlexatarSDK** supplies both **audio** and **video** tracks ensuring lipsyncing  

```
  navigator.mediaDevices
    .getUserMedia({audio: true,})
    .then((stream) => {
        flexatarSDK.audioInputByMediaStrem(stream)
    })
```

_We are planning to share the example of interfacing [pion](https://github.com/pion/webrtc) soon_

### Scenario 2: Animating audio for user :headphones:
![In-Browser Animation with Flexatar](flexatarAnimation.jpg)
We are targeting obvious applications like virtual assistants, bots etc. The [demo](https://www.flexatar-sdk.com/demo) provides an idea how it works.

All you need is to
- init FlexatarAnimator with token and link to the flexatar
- provide audio
- connect output to a video element

```
videoElement.srcObject = ftar.FlexatarSDK.mediaStreamFactory(
    "<token>",
    "<flexatar link from telegram bot>",
    mediaStream, // media stream with audio track
    (success) => {
        if (success){
            // Do your awesome stuff ...
        }else{
            console.log("Flexatar media stream is unavailable")
        }
    }
)
```

In the context of the mentioned scenario, we are working on integration with

- various frontend frameworks
- popular Text-To-Speech (TTS) services

Stay tuned!


### Scenario 3: Making static images "Magic" :movie_camera:
Like in Magic movies: a photo starts moving.
From the technical point of view: no need to fetch audio features and animate as above, animation pattern is enough.

## Using Flexatar SDK on your Website

### B2B Callflow

We are providing **FLexatarSDK** as B2B to our partners.

By default, our services are provided as prepaid. After the money paid, we are sharing a **Secret**.


![B2B Flexatar Callflow](flexatar-B2B.jpg)
To enable our **FLexatar SDK** for your customers, you need to receive **Token** from our backend and provide it to your customer.

When a user requires a service from our partner (1), a partner needs to make **POST** request (2) to our backend, with **Secret** in Bearer header and json in request body. The json contains user data and tariff ("subscription") to be used.

The response (3) contains json with **Token** that is to be provided to the user, alongside with a webpage and **Flexatar SDK** (4).

When SDK needs to create or download Flexatar (5) for the user, the **Token** is involved.

### B2B POST Parameters

**Request Headers:**
```
"Content-Type: application/json" 
"Authorization: Bearer <Secret>"
```

**POST Request JSON Fields:**
```
"subscription": "<the tariff to be used>",
"authtype": "<the way how the end-user was authenticated, like gmail.com>",
"user": "<user id>",
"resubscribe": true   __optional, if the user is to be charged as a new one__
```

**POST Response fields:**
```
"token": "<token for the given end-user>",
"ExpiresAt": "when the token expires",
"is_expired": <bool>  __if the token expires, either time-based or resources consumed__
"exists": <bool> __if the token is charged now or have already been charged earlier__
```

### Making payments

We'll accept Stripe payments soon. We are open to discuss other alternatives.

## FAQ

1.What **flexatar** stands for?  

- **Flexatar** is our format of storing **3d model of human face**, capable of online animating **in browser in realtime using WebGL**.
 
2.Can I make a **flexatar** by my own?

- Sure. Just send a photo to our [telegram bot](https://t.me/flexatar_bot)
 
3.Is it 3D?
 
 - Yes! We can export flexatar as a conventional **.obj** file with 3d model and textures. If you are a game developer and need either a custom 3d or a morphable model, please feel free to contact us

4.What's under the hood?

 - Our in-house math runs on backend to compute and store **flexatars**
 - Rendering is performed in JS with WebGL

5.How much time does it take to create a **flexatar**?
 
 - It takes couple of seconds to compute **flexatar** on GPU by photo, and few more seconds to deliver/queue etc. Making high quality flexatar with custom mouth takes about 10 seconds

6.Is the technology scalable?

 - Yes. The backend runs on AWS and is intended to be extremely scalable, both in terms of **flexatar** creation and use

7.Mobile SDK?

 - Scheduled

8.Any restrictions?
 
 - All the flexatars must be stored on our resources exclusively. It is prohibited to store or cache **Flexatars**
 - **Flexatars** belong to both the person who owns the image and us who created it and can't be used by any side without mutual agreement
 - We'll charge for commercial use of our technology
 - LICENSE is to be published soon