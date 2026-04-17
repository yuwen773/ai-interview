import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// 初始化深色模式（避免页面闪烁）
(function initTheme() {
    const stored = localStorage.getItem('theme');
    const isDark = stored !== 'light';
    if (isDark) {
        document.documentElement.classList.add('dark');
    }
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
