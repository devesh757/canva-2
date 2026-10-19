// App root: routes home ↔ editor + global toasts.
import { useEffect, useState } from 'react';
import Home from './components/Home.jsx';
import Editor from './components/Editor.jsx';
import { uid } from './lib/utils.js';

function ToastHost() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const onToast = (e) => {
      const { msg, kind } = e.detail;
      const id = uid();
      setItems((prev) => [...prev.slice(-3), { id, msg, kind }]);
      setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3200);
    };
    window.addEventListener('ls-toast', onToast);
    return () => window.removeEventListener('ls-toast', onToast);
  }, []);
  if (!items.length) return null;
  return (
    <div className="toast-host">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>{t.msg}</div>
      ))}
    </div>
  );
}

export default function App() {
  const [design, setDesign] = useState(null);

  if (design) {
    return (
      <>
        <Editor
          key={design.id}
          design={design}
          onSaved={() => {}}
          onExit={() => setDesign(null)}
        />
        <ToastHost />
      </>
    );
  }
  return (
    <>
      <Home
        onOpen={(d) => {
          // A template choice injects _template for the editor to apply on mount.
          if (d._template) {
            const { _template, ...rest } = d;
            setDesign(rest);
            window.__lsPendingTemplate = _template;
          } else {
            window.__lsPendingTemplate = null;
            setDesign(d);
          }
        }}
      />
      <ToastHost />
    </>
  );
}
