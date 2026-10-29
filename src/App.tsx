import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider.tsx';
import AppRoutes from './routes/AppRoutes.tsx';
import { ConfirmationProvider } from './components/confirmation/ConfirmationProvider.tsx';

export default function App() {
  return <BrowserRouter><AuthProvider><ConfirmationProvider><AppRoutes /></ConfirmationProvider></AuthProvider></BrowserRouter>;
}
