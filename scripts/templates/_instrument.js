import { rule, $, $$, $i, log } from './_setup.js';

export default () => {
    rule.instrument.add([['body', () => $(document.body), { type: 'single' }]]);
};
