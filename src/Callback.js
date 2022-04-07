import logo from './logo.png';
import './App.css';
import React from 'react';
import { useSearchParams } from 'react-router-dom';

function Callback() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          OAuth Broker Test Client
        </p>
        <p className="App-text">
          {error ? `Failed: ${error}` : "Success!" }
        </p>
      </header>
    </div>
  );
}

export default Callback;
