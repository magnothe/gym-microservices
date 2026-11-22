import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

// Sem StrictMode de propósito: ele duplica os efeitos em desenvolvimento
// e cada requisição apareceria duas vezes no log de comunicação.
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
