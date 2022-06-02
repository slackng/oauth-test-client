import logo from "./logo.png";
import "./App.css";
import { encode as base64_encode } from "base-64";
import React, { useEffect, useState } from "react";

function App() {
  const DEFAULT_CLIENT_ID = process.env.REACT_APP_DEFAULT_CLIENT_ID;
  const DEFAULT_CLIENT_SECRET = process.env.REACT_APP_DEFAULT_CLIENT_SECRET;
  const OAUTH_BROKER_URL = process.env.REACT_APP_OAUTH_BROKER_URL;
  const DEFAULT_TOKEN_KEY = process.env.REACT_APP_DEFAULT_TOKEN_KEY;
  const [brokerUrl, setBrokerUrl] = useState(OAUTH_BROKER_URL);
  const [clientId, setClientId] = useState(DEFAULT_CLIENT_ID);
  const [clientSecret, setClientSecret] = useState(DEFAULT_CLIENT_SECRET);
  const [providers, setProviders] = useState([]);
  const [providerInfo, setProviderInfo] = useState(null);
  const [token, setToken] = useState(null);
  const [authUrl, setAuthUrl] = useState(null);
  const [tokenKey, setTokenKey] = useState(DEFAULT_TOKEN_KEY);
  const [tokenValue, setTokenValue] = useState("");
  const [activeProvider, setActiveProvider] = useState("");
  const [activeProviderIndex, setActiveProviderIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [subjectToken, setSubjectToken] = useState("");

  function refreshToken() {
    const url =
      `${brokerUrl}/oauth/refresh?` +
      new URLSearchParams({
        provider: activeProvider,
        tokenKey: tokenKey,
      });
    const requestOptions = {
      method: "GET",
      headers: {
        "Access-Control-Allow-Origin": `http://localhost:${process.env.port}`,
        Authorization: "Bearer " + token,
      },
    };
    fetch(url, requestOptions)
      .then((response) => response.json())
      .then((data) => {
        setTokenValue(data["tokenValue"]);
      })
      .catch((e) => alert("Failed to get token info: " + e));
  }

  function refreshTokenSubject() {
    const url =
      `${brokerUrl}/oauth/subject/refresh?` +
      new URLSearchParams({
        provider: activeProvider,
        subject: tokenKey,
      });
    const requestOptions = {
      method: "GET",
      headers: {
        "Access-Control-Allow-Origin": `http://localhost:${process.env.port}`,
        Authorization: "Bearer " + token,
      },
    };
    fetch(url, requestOptions)
      .then((response) => response.json())
      .then((data) => {
        setSubjectToken(data["subjectToken"]);
      })
      .catch((e) => alert("Failed to get token info: " + e));
  }

  function loadToken() {
    const url = `${brokerUrl}/tokens/${activeProvider}/${tokenKey}`;
    const requestOptions = {
      method: "GET",
      headers: {
        "Access-Control-Allow-Origin": `http://localhost:${process.env.port}`,
        Authorization: "Bearer " + token,
      },
    };
    fetch(url, requestOptions)
      .then((response) => response.json())
      .then((data) => {
        setTokenValue(data["tokenValue"]);
      })
      .catch((e) => alert("Failed to get token info: " + e));
  }

  function loadTokenSubject() {
    const url =
      `${brokerUrl}/oauth/subject/token?` +
      new URLSearchParams({
        provider: activeProvider,
        tokenKey: tokenKey,
        state: "passthrough",
      });
    const requestOptions = {
      method: "GET",
      headers: {
        "Access-Control-Allow-Origin": `http://localhost:${process.env.port}`,
        Authorization: "Bearer " + subjectToken,
      },
    };
    fetch(url, requestOptions)
      .then((response) => response.json())
      .then((data) => {
        setTokenValue(data["accessToken"]);
      })
      .catch((e) => alert("Failed to get token info"));
  }

  function handleLogin(e) {
    e.preventDefault();
    const url = `${brokerUrl}/auth/service`;
    const requestOptions = {
      method: "POST",
      headers: {
        "Access-Control-Allow-Origin": `http://localhost:${process.env.port}`,
        Authorization: "Basic " + base64_encode(`${clientId}:${clientSecret}`),
      },
    };
    fetch(url, requestOptions)
      .then((response) => response.json())
      .then((data) => {
        setToken(data["token"]);
        return data["token"];
      })
      .then((token) => getProviders(token))
      .catch((e) => {
        alert("Unauthorized");
        return;
      });
  }

  function handleUpdateProvider(e) {
    e.preventDefault();
    var data = JSON.parse(providerInfo);
    var name = data["id"]["name"];
    data["name"] = name;
    delete data["id"];
    const url = `${brokerUrl}/providers`;
    console.log(data);
    const requestOptions = {
      method: "PUT",
      headers: {
        "Access-Control-Allow-Origin": `http://localhost:${process.env.port}`,
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };
    fetch(url, requestOptions)
      .then((response) => response.json())
      .then((data) => alert("Success"))
      .then(() => getProviders(token))
      .catch((e) => alert("Failed to update client config: " + e));
  }

  function getProviders(token) {
    const url = `${brokerUrl}/providers`;
    const requestOptions = {
      method: "GET",
      headers: {
        "Access-Control-Allow-Origin": `http://localhost:${process.env.port}`,
        Authorization: "Bearer " + token,
      },
    };
    fetch(url, requestOptions)
      .then((response) => response.json())
      .then((data) => {
        data = data.map((e) => {
          delete e["tokens"];
          delete e["dateCreated"];
          delete e["dateUpdated"];
          return e;
        });
        setProviders(data);
        setActiveProvider(data[0]["id"]["name"]);
        setActiveProviderIndex(0);
      })
      .catch((e) => alert("Failed to get providers: " + e));
  }

  function updateActiveProvider(index, name) {
    setActiveProvider(name);
    setActiveProviderIndex(index);
  }

  function handleInitSubject(e) {
    e.preventDefault();
    var url =
      `${brokerUrl}/oauth/subject/init?` +
      new URLSearchParams({
        provider: activeProvider,
        subject: tokenKey,
        state: "passthrough",
      });
    if (query !== "") {
      url += "&" + query;
    }
    const requestOptions = {
      method: "GET",
      headers: {
        "Access-Control-Allow-Origin": `http://localhost:${process.env.port}`,
        Authorization: "Bearer " + token,
      },
    };
    fetch(url, requestOptions)
      .then((response) => response.json())
      .then((data) => {
        if (data["redirect"]) {
          setAuthUrl(data["redirect"]);
        } else if (data["subjectToken"]) {
          setSubjectToken(data["subjectToken"]);
        }
      })
      .catch((e) => alert(e));
  }

  function handleInit(e) {
    e.preventDefault();
    var url =
      `${brokerUrl}/oauth/init?` +
      new URLSearchParams({
        provider: activeProvider,
        tokenKey: tokenKey,
        state: "passthrough",
      });
    if (query !== "") {
      url += "&" + query;
    }
    const requestOptions = {
      method: "GET",
      headers: {
        "Access-Control-Allow-Origin": `http://localhost:${process.env.port}`,
        Authorization: "Bearer " + token,
      },
    };
    fetch(url, requestOptions)
      .then((response) => response.json())
      .then((data) => {
        setAuthUrl(data["redirect"]);
      })
      .catch((e) => alert(e));
  }

  function handleRedirect(url) {
    window.open(url);
  }

  function parseJwt(token) {
    var base64Url = token.split(".")[1];
    var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    var jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    return JSON.parse(jsonPayload);
  }

  function parseExpiry(token) {
    var exp = parseJwt(token)["exp"];
    return new Date(parseInt(exp) * 1000);
  }

  function handleReset() {
    window.location.replace("/");
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>OAuth Broker Test Client</p>
        <form className="App-text" onSubmit={(e) => handleLogin(e)}>
          <input
            type="text"
            name="brokerUrl"
            defaultValue={OAUTH_BROKER_URL}
            placeholder="Broker"
            size="40"
            onChange={(e) => setBrokerUrl(e.target.value)}
          />
          <input
            type="text"
            name="clientId"
            defaultValue={DEFAULT_CLIENT_ID}
            placeholder="Username"
            size="30"
            onChange={(e) => setClientId(e.target.value)}
          />
          <input
            type="password"
            name="clientSecret"
            defaultValue={DEFAULT_CLIENT_SECRET}
            placeholder="Password"
            onChange={(e) => setClientSecret(e.target.value)}
          />
          <input type="submit" value="Authorize with broker" />
        </form>
        <p className="App-text">
          {token
            ? `Authorization valid until ${parseExpiry(token)}`
            : "Please authorize first"}
        </p>
        <form className="App-text" onSubmit={(e) => handleUpdateProvider(e)}>
          <select
            name="providers"
            onChange={(e) => {
              updateActiveProvider(
                e.target.value,
                providers[e.target.value]["id"]["name"]
              );
            }}
          >
            {providers.map((e, index) => (
              <option value={index}>{e["id"]["name"]}</option>
            ))}
          </select>
          <br></br>
          <textarea
            defaultValue={JSON.stringify(
              providers[activeProviderIndex],
              null,
              4
            )}
            rows="10"
            cols="100"
            onChange={(e) => setProviderInfo(e.target.value)}
          />
          <br></br>
          <input
            disabled={token === null}
            type="submit"
            value="Update config"
          />
        </form>
        <br></br>
        <form className="App-text" onSubmit={(e) => handleInit(e)}>
          <input
            type="text"
            name="tokenKey"
            defaultValue={DEFAULT_TOKEN_KEY}
            placeholder="Token Key"
            onChange={(e) => setTokenKey(e.target.value)}
          />
          <input
            type="text"
            name="query"
            size={50}
            placeholder="Query Params"
            onChange={(e) => setQuery(e.target.value)}
          />
          <input
            disabled={token === null || tokenKey === null || tokenKey === ""}
            type="submit"
            value="Get OAuth URL as client"
          />
        </form>
        <form className="App-text" onSubmit={(e) => handleInitSubject(e)}>
          <input
            type="text"
            name="subject"
            defaultValue={DEFAULT_TOKEN_KEY}
            placeholder="Subject"
            onChange={(e) => setTokenKey(e.target.value)}
          />
          <input
            type="text"
            name="query"
            size={50}
            placeholder="Query Params"
            onChange={(e) => setQuery(e.target.value)}
          />
          <input
            disabled={token === null || tokenKey === null || tokenKey === ""}
            type="submit"
            value="Init OAuth flow as client of service "
          />
        </form>
        <p className="App-text">{authUrl ? "Ready to redirect" : ""}</p>
        <button
          disabled={authUrl === null}
          onClick={() => handleRedirect(authUrl)}
        >
          Redirect to provider
        </button>
        <p className="App-text">
          Subject token:<br></br>
          <textarea
            rows="10"
            cols="100"
            value={subjectToken}
            onChange={(e) => setSubjectToken(e.target.value)}
          />
          <br />
          <button onClick={loadTokenSubject}>
            Exchange subject token for token
          </button>
        </p>
        <p className="App-text">
          Tokenstore value:<br></br>
          <textarea disabled rows="10" cols="100" value={tokenValue} />
          <br />
          <form className="App-text">
            <input
              type="text"
              name="subject"
              defaultValue={DEFAULT_TOKEN_KEY}
              placeholder="Token Key/Subject"
              onChange={(e) => setTokenKey(e.target.value)}
            />
          </form>
          <button onClick={loadToken}>Reload as client</button>
          <button onClick={refreshToken}>Refresh as client</button>
          <button onClick={refreshTokenSubject}>Refresh as service</button>
        </p>
        <br></br>
        <button onClick={handleReset}>Reset</button>
      </header>
    </div>
  );
}

export default App;
