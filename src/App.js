import logo from './logo.png';
import './App.css';
import {encode as base64_encode} from 'base-64';
import React, { useState } from 'react';

function App() {
  const DEFAULT_CLIENT_ID = process.env.REACT_APP_DEFAULT_CLIENT_ID;
  const DEFAULT_CLIENT_SECRET = process.env.REACT_APP_DEFAULT_CLIENT_SECRET;
  const OAUTH_BROKER_URL = process.env.REACT_APP_OAUTH_BROKER_URL;
  const DEFAULT_TOKEN_KEY= process.env.REACT_APP_DEFAULT_TOKEN_KEY;
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

  function loadToken() {
    const url = `${OAUTH_BROKER_URL}/tokens/${activeProvider}/${tokenKey}`;
    const requestOptions = {
      method: 'GET',
      headers: {
        'Access-Control-Allow-Origin': `http://localhost:${process.env.port}`,
        'Authorization': 'Bearer ' +  token
      }
      
    }
    fetch(url, requestOptions)
      .then(response => response.json())
      .then(data => {
        setTokenValue(data["tokenValue"]);
      })
      .catch(e => alert("Failed to get token info"))
  }

  function handleLogin(e) {
    e.preventDefault();
    const url = `${OAUTH_BROKER_URL}/auth/service`;
    const requestOptions = {
      method: 'POST',
      headers: {
        'Access-Control-Allow-Origin': `http://localhost:${process.env.port}`,
        'Authorization': 'Basic ' + base64_encode(`${clientId}:${clientSecret}`)
      }
    }
    fetch(url, requestOptions)
      .then(response => response.json())
      .then(data => {
        setToken(data["token"]);
        return data["token"];
      })
      .then((token) => getProviders(token))
      .catch(e => {
        alert("Unauthorized");
        return;
      })
  }

  function handleUpdateProvider(e) {
    e.preventDefault();
    var data = JSON.parse(providerInfo);
    var name = data["id"]["name"];
    data["name"] = name;
    delete data["id"];
    const url = `${OAUTH_BROKER_URL}/providers`;
    console.log(data);
    const requestOptions = {
      method: 'PUT',
      headers: {
        'Access-Control-Allow-Origin': `http://localhost:${process.env.port}`,
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }
    fetch(url, requestOptions)
      .then(response => response.json())
      .then(data => alert("Success"))
      .then(() => getProviders(token))
      .catch(e => alert("Failed to update client config: " + e))
  }

  function getProviders(token) {
    const url = `${OAUTH_BROKER_URL}/providers`;
    const requestOptions = {
      method: 'GET',
      headers: {
        'Access-Control-Allow-Origin': `http://localhost:${process.env.port}`,
        'Authorization': 'Bearer ' + token
      }
    }
    fetch(url, requestOptions)
      .then(response => response.json())
      .then(data => {
        data = data.map(e => {
          delete e["tokens"];
          delete e["dateCreated"];
          delete e["dateUpdated"];
          return e;
        });
        setProviders(data);
        setActiveProvider(data[0]["id"]["name"]);
        setActiveProviderIndex(0);
      })
      .catch(e => alert("Failed to get providers: " + e))
  }

  function updateActiveProvider(index, name) {
    setActiveProvider(name);
    setActiveProviderIndex(index);
  }
  
  function handleInit(e) {
    e.preventDefault();
    var url = `${OAUTH_BROKER_URL}/oauth/init?` + new URLSearchParams({
      provider: activeProvider,
      tokenKey: tokenKey,
      state: 'passthrough',
    });
    if (query !== "") {
     url += "&" + query
    }
    const requestOptions = {
      method: 'GET',
      headers: {
        'Access-Control-Allow-Origin': `http://localhost:${process.env.port}`,
        'Authorization': 'Bearer ' +  token
      }
    }
    fetch(url, requestOptions)
      .then(response => response.json())
      .then(data => {
        setAuthUrl(data["redirect"]);
      })
      .catch(e => alert(e));
  }

  function handleRedirect(url) {
    window.open(url);
  }

  function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  };

  function parseExpiry(token) {
    var exp = parseJwt(token)["exp"];
    return (new Date(parseInt(exp) * 1000));
  };

  function handleReset() {
    window.location.replace("/");
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          OAuth Broker Test Client
        </p>
        <form className="App-text" onSubmit={e => handleLogin(e)}>
          <input type="text" name="clientId" defaultValue={DEFAULT_CLIENT_ID} placeholder="Username" onChange={e => setClientId(e.target.value)}/>
          <input type="password" name="clientSecret" defaultValue={DEFAULT_CLIENT_SECRET} placeholder="Password" onChange={e => setClientSecret(e.target.value)} />
          <input type="submit" value="Authorize with broker"/>
        </form>
        <p className="App-text">
            {token ? `Authorization valid until ${parseExpiry(token)}` : "Please authorize first"}
        </p>
        <form className="App-text" onSubmit={e => handleUpdateProvider(e)}>
          <select name="providers" onChange={e => {
              updateActiveProvider(e.target.value, providers[e.target.value]["id"]["name"]);
            }}>
            { providers.map((e, index) => <option value={index}>{e["id"]["name"]}</option>)}
          </select>
          <br></br>
          <textarea defaultValue={JSON.stringify(providers[activeProviderIndex], null, 4)} rows="10" cols="100" onChange={e => setProviderInfo(e.target.value)} />
          <br></br>
          <input disabled={token === null} type="submit" value="Update config" />
        </form>
        <br></br>
        <form className="App-text" onSubmit={e => handleInit(e)}>
          <input type="text" name="tokenKey" defaultValue={DEFAULT_TOKEN_KEY} placeholder="Token Key" onChange={e => setTokenKey(e.target.value)}/>
          <input type="text" name="query" size={50} placeholder="Query Params" onChange={e => setQuery(e.target.value)}/>
          <input disabled={token === null || tokenKey === null || tokenKey === ""} type="submit" value="Get OAuth URL from broker" />
        </form>
        <p className="App-text">
          {authUrl ? "Ready to redirect" : ""}
        </p>
        <button
          disabled={authUrl === null}
          onClick={() => handleRedirect(authUrl)}
        >
          Redirect to provider
        </button>
        <p className="App-text">
          Tokenstore value:<br></br>
          <textarea disabled rows="10" cols="100" value={tokenValue} /><br />
          <button
            onClick={loadToken}
          >
          Reload
          </button>
        </p>
        <br></br>
        <button
          onClick={handleReset}
        >
          Reset
        </button>
      </header>
    </div>
  );
}

export default App;
