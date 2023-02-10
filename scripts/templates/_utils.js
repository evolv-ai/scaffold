// import { $, $$, $i, rule, log } from './_setup';

// Lit HTML transforms supporting augmented template literal syntax:
// html`<p>It's the best</p>`

function transform(exp) {
    if (Array.isArray(exp)) return exp.join('');
    if (typeof exp === 'number') return exp.toString();
    return exp || '';
}

export function html(strings, ...exps) {
    return strings
        .map((s, i) => `${s}${transform(exps[i])}`)
        .join('')
        .replace(/^[\n\r\s]+/, '');
}
