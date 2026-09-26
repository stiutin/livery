// Every tenant's design tokens, compiled at build time; global.css only refers to them.
import 'virtual:livery/tenants.css';
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
    {/* The router works below the base path, /livery/ on GitHub Pages. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
