import { rule, $, $$, $i, store, app, log } from './_imports/_setup.js';
import instrumentPage from './_imports/_instrument.js';
__variantImports__

// Uncomment the line below in production to enable SPA handling
// rule.id = '__contextId__';

__variantDeclarations__

instrumentPage();
