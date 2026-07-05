import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AppRoutes from './AppRoutes.jsx'
import { Provider } from 'react-redux'
import { reduxStore } from './Store.js'

createRoot(document.getElementById('root')).render(

  <Provider store={reduxStore}>
    <AppRoutes>
      <App />
    </AppRoutes>
  </Provider>
)
