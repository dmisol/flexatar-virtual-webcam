
# Flexatar API Integration Guide

## Overview

This guide provides step-by-step instructions for integrating the Flexatar API into your application, managing user subscriptions, and handling user tokens effectively.

---

## 1. Obtaining a User Token

### Your Backend Responsibilities:
1. **Call the `usertoken` endpoint** of the Flexatar API service to obtain a user token for the user interacting with your front end.
2. **Deliver the token to your front end**, where it will be used with the Flexatar SDK to provide functionality.

> **Note:** A user token can only be obtained for an **existing subscription**.

---

## 2. Creating a Subscription

### Steps to Create a Subscription:
- if subscription exists call `delsubscription` endpoint to delete subscription.
- Call the `buysubscription` endpoint to create a subscription.

### Example Use Case: Video Generator
1. When you receive a `payment_success` event from your payment provider, call the `buysubscription` endpoint on the Flexatar API service.
2. After the subscription is created, obtain a user token using the `usertoken` endpoint.

---

## 3. Shared Subscription for Demos or Virtual Assistants

- For use cases such as a virtual assistant or providing a demo with a fixed number of predefined Flexatars:
  - Create a single user subscription.
  - Obtain a user token and share it with all your customers.
  - Use `curl` to call the `buysubscription` endpoint for creating the subscription.

---

## 4. Handling Token Expiration or Session Limits

### Token Expiration:
- While using the Flexatar SDK on the front end, you may encounter an expired token or one that has reached its session limit.
- When this happens:
  - Call the `delsubscription` endpoint to delete the existing subscription.
  - Call the `buysubscription` endpoint to create a new subscription.
  - Obtain a new user token by calling the `usertoken` endpoint.

---

# Flexatar API 
All this endpoints are managed to call on your backend. Never provide FLEXATAR_API_SECRET to your front end.

## Buy Subscription

```bash
curl -X POST https://api.flexatar-sdk.com/b2b/buysubscription \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer FLEXATAR_API_SECRET" \
     -d '{"authtype":"auth_tag","user":"user_id","crt":"random_string","testing":true/false}'
```
### Response
- **204** - empty response. Subscription successfully bought.
### Errors
- **453** - low balance. Not enough funding in your account to by subscription.
- **454** - idempotancy mismatch. Request made to buy subscription for new user but with same `"crt"`.
- **456** - user exists. Can't buy subscritpion for user that already has subscription. Delete this subscription first.

### Inputs
- `FLEXATAR_API_SECRET` - get it on [flexatar-sdk.com](https://flexatar-sdk.com)
- `"authtype"` - identifies the type of authentication or authorization being used like phone, email, google... The value of this field must consist only of letters (A-Z, a-z) or digits (0-9). Special characters and spaces are not allowed. Define it your own way.
- `"user"` - contains user ID like email or phone number, consists of any symbols.
- `"crt"` - client request token. In case the response code is from 500-series, retry request with same crt. That grants you won't be charged for this request again. We suggest using V4 UUIDs, or another random string with enough entropy to avoid collisions.
- `"testing"` - set `true` or `false`. If testing enabled you won't be charged for this request. 

Subscription is given for 1 month.




## Delete Subscription

```bash
curl -X POST https://api.flexatar-sdk.com/b2b/delsubscription \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer FLEXATAR_API_SECRET" \
     -d '{"authtype":"auth_tag","user":"user_id","testing":true/false}'
```

Deletes subscription for given `"authtype"` and  `"user"`. Use it if you want to buy new subscription for given user.

### Response
- **204** - empty response. Subscription successfully deleted.

## Get User Token

```bash
curl -X POST https://api.flexatar-sdk.com/b2b/usertoken \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer FLEXATAR_API_SECRET" \
     -d '{"authtype":"auth_tag","user":"user_id","restricted":true/false,"testing":true/false,"restricted":true/false}'
```

### Response
- **200** - success.
- **body** - `{"token":"USER_TOKEN","exp":"EXPIRATION_DATE","crt":"CRT","is_expired":true/false}`

### Errors
- **404** - user not found.

`"restricted"` - restricted token not allow to creat or delete flexatars. Use it for virtual assistants.

`"USER_TOKEN"` - must be delivered to browser for flexatar SDK functionality.

`"EXPIRATION_DATE"` - can be set to browsers cookies as is.

`"CRT"` - crt that was in `buysubscription` request. Comparing `CRT` values one can detect if new subscription is ready.


## Set User Subscription For Testing

```bash
curl -X POST https://api.flexatar-sdk.com/b2b/settesting \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer FLEXATAR_API_SECRET" \
     -d '{"authtype":"auth_tag","user":"user_id"}'
```
To eanble testing mode you have to buy at least one subscription. Call this endpoint to attach subscription to testing mode. Then, while you are makeing requests with `"testing":true` flag, you won't be charged for buying the subscription.

You can attach only one subscription to testing mode.

Calling endpoint `usertoken` in testing mode gives response with user token same as in subscription you are attached to testing.

Using testing mode you can develop the integration with Flexatar Api without incurring any charges. When you are ready to go in production just set `"testing":false` in all your requests.

### Response
- **204** - empty response. Subscription successfully set as testing.

### Errors
- **404** - user not found.

