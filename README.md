# OAuth Broker

## Install

1. Run `npm install`
2. Rename `.env.sample` to `.env` and populate the variables accordingly.
3. Run `npm run start`

## Spin up the Broker

Assuming the Broker is running for the first time on your machine, you would need to manually add a new Client and Provider. For the Client, you could use the existing test client that is bootstrapped with the Broker, or create your own with Admin client credentials. The easiest way is to use the test Client bootstrapped with the provider and the following steps assume we are using this bootstrapped test client.

### Authenticating with the Broker

Before making any request to the Broker, to get an auth token, make a `POST` request to the following Broker endpoint: `http://{{host}}:{{port}}/auth/service` with the following header:

```
Basic: <base64encoded(ffffffff-ffff-ffff-ffff-ffffffffffff:TEST)>
```

### Creating a provider

With the token returned above as an `Authorization: Bearer <token>` header, make a `PUT` request to the following Broker endpoint: `http://{{host}}:{{port}}/providers` with the following body

```json
{
  "name": "provider-name",
  "authUri": "https://example.com/o/oauth2/v2/auth",
  "tokenUri": "https://example.com/token",
  "redirectUri": "http://localhost:3000/oauth/callback",
  "clientId": "abc",
  "clientSecret": "123",
  "config": {
    "moreCustomQueryParams": "ok"
  }
}
```

The config object is a single-level string-only JSON object that will be appended to the authorization URL as query params. In the example above, `&moreCustomQueryParams=ok` will be appended. It can be left blank in the payload if not needed.

## Using the Client

![Diagram](/public/diagram.png)

1. Enter the Broker client ID and client secret. Clicking <button>Authorize with broker</button> will load the auth token.
2. Once loaded, and assuming Providers are available, select the appropriate Provider.
3. If a config is available, it will show here. Otherwise, enter it in JSON format. E.g.

```json
{
  "moreCustomQueryParams": "ok"
}
```

4. Click <button>Update config</button> to store the updated config with the Provider.
5. Enter a token key. If not, the default token key will be used. A token key the key with which your OAuth token is stored with the Broker. It is unique to the Client ID and Provider name.
6. Enter any additional query params needed for the authorization part of the OAuth transaction in the form `abc=123&xyz=420`. This is typically documented for you on the Provider's documentation. For example, [this](https://developers.google.com/identity/protocols/oauth2/web-server#creatingclient) is Google's.
7. Click <button>Get OAuth URL from broker</button> and a redirectable auth URL will be returned from the Broker.
8. Click <button>Redirect to provider</button> will redirect to the provider to ask for user authorization and consent.
9. Assuming the Provider authenticated and authorized the user successfully, a new tab will be opened with a success page. On clicking <button>Reload</button>, you will see the latest token associated with the user and token key.
10. Clicking <button>Reset</button> has the same effect as reloading the page and will clear all values, including the auth token.
