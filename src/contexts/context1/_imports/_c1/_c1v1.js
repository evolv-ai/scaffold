import { rule, $, $$, $i, store, app, log } from '../_setup.js';
import { html } from '../_utils.js';
import c1 from './_c1.js';

export default () => {
    rule.track('c1v1');

    c1(); // Shared code for all of variable c1

    // Variant code for c1v1 goes here
};
