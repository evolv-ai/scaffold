import { version } from '../../../evolv.config.js';
import { rule, /* $, $$, $i, store, app, log */ } from './_imports/_setup.js';
import instrumentPage from './_imports/_instrument.js';
__variantImports__

__variantDeclarations__

// Note: SPA handling does not work properly in a local dev environment
rule.id = `__contextId__${version}`

instrumentPage();
