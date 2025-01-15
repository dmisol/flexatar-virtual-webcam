# Flexatar Platform API 

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
     -d '{"authtype":"auth_tag","user":"user_id","testing":true/false}'
```

### Response
- **200** - success.
- **body** - `{"token":"USER_TOKEN","exp":"EXPIRATION_DATE","crt":"CRT"}`

### Errors
- **404** - user not found.

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

