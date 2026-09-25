import './styles/global.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter} from 'react-router';

import App from './routes/App';

const root = document.getElementById('root');
if (!root) {
  throw new Error('index.html has no #root element');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
