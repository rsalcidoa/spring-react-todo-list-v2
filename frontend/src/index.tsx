import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './styles/theme.css';
import './styles/themes/ink.css';
import './styles/themes/phosphor.css';
import './styles/themes/nord.css';

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<React.StrictMode><App /></React.StrictMode>);
