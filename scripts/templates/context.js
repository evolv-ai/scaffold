import evolvConfig from '../../../evolv.config.js';
import { rule, /* $, $$, $i, store, app, log */ } from './_imports/_setup.js';
import instrumentPage from './_imports/_instrument.js';
__variantImports__

__variantDeclarations__

// Prevents active key listener from disabling context in dev environment
if (window.evolv.client) {
  window.evolv.client
    .getActiveKeys('web.__contextId____version__')
    .then(() => { rule.id = `__contextId__${evolvConfig.version || ''}` });
}

instrumentPage();
