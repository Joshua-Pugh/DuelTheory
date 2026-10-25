import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './styles.css';
import './ashenLayered.css';
import './platformNavigation.css';
import './platformPages.css';
import './siteWorkbench.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
