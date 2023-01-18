import { $, $$, $i, rule, log } from './_setup';

// Lit HTML transforms supporting augmented template literal syntax:
// html`<p>It's the best</p>`

function transform(exp) {
    return Array.isArray(exp) ? exp.join('') : exp || '';
}

export function html(strings, ...exps) {
    return strings
        .map((s, i) => `${s}${transform(exps[i])}`)
        .join('')
        .replace(/^[\n\r\s]+/, '');
}
