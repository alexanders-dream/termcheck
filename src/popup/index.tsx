import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '../index.css' // Ensure tailwind is loaded
import '../lib/browser' // Ensure webextension-polyfill is loaded

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
