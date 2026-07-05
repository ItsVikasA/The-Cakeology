import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AppRoutes from './AppRoutes.jsx'
import { Provider } from 'react-redux'
import { reduxStore } from './Store.js'
import { warmUpBackend } from './Shared/warmup.js'

// Nudge the (possibly sleeping) backend awake as early as possible so it's
// ready by the time the user interacts with auth / data screens.
warmUpBackend();

createRoot(document.getElementById('root')).render(

  <Provider store={reduxStore}>
    <AppRoutes>
      <App />
    </AppRoutes>
  </Provider>
)
