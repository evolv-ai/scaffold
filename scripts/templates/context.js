import { version } from '../../../evolv.config.js';
import { rule, /* $, $$, $i, store, app, log */ } from './_imports/_setup.js';
import instrumentPage from './_imports/_instrument.js';
__variantImports__

__variantDeclarations__

// Uncomment the following to enable active key listening for SPA handling.
// For local development you can do this once the A/A test is running
// rule.id = `__contextId__${version}`

instrumentPage();
