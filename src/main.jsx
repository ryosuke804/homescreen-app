import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initFirestoreStorage } from './firestore-storage.js'
import * as analytics from './analytics.js'

// Firestoreストレージを初期化（LocalStorageの代わり）
initFirestoreStorage()

// アナリティクス機能をグローバルに公開（ブラウザコンソールから使用可能）
window.analytics = analytics

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
