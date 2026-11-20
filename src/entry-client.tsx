import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ContentProvider } from './content/ContentContext';
import { getStaticContent } from './content/static';
import type { ContentState } from './content/types';
import './styles/index.css';

async function main() {
  let initial: ContentState = getStaticContent();
  if (import.meta.env.DEV) {
    // Local mode: edits saved in /admin (IndexedDB) take precedence over content/.
    const { loadLocalContent } = await import('./admin/data/repository');
    initial = (await loadLocalContent()) ?? initial;
  }
  const tree = (
    <StrictMode>
      <ContentProvider initial={initial}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ContentProvider>
    </StrictMode>
  );
  const root = document.getElementById('root')!;
  // Prerendered pages hydrate; the admin shell (empty) renders client-side.
  if (root.firstElementChild && !import.meta.env.DEV) hydrateRoot(root, tree);
  else createRoot(root).render(tree);
}

main();
