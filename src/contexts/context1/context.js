import { rule, $, $$, $i, store, app, log } from './_imports/_setup.js';
import instrumentPage from './_imports/_instrument.js';
import c1v1 from './_imports/_c1/_c1v1';
import c1v2 from './_imports/_c1/_c1v2';

// Uncomment the line below in production to enable SPA handling
// rule.id = 'context1';

rule.app.c1v1 = c1v1;
rule.app.c1v2 = c1v2;

instrumentPage();
