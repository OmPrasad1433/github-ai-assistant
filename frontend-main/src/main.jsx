import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { AuthProvider } from './authContext.jsx'
import ProjectRoutes from './Routes.jsx';
import { BrowserRouter as Router } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import axios from 'axios'

axios.defaults.baseURL = import.meta.env.VITE_API_URL || "http://localhost:3002";
axios.defaults.withCredentials = true;

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <Router>
      <Toaster 
        toastOptions={{
          style: {
            background: '#161b22',
            color: '#c9d1d9',
            border: '1px solid #30363d',
          },
        }}
      />
      <ProjectRoutes />
    </Router>
  </AuthProvider>
);
