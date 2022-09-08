import { rule, $, $$ } from './setup.js'
import "./context.scss";

import { instrumentPage } from './instrumentPage.js';

rule.app = {
};

instrumentPage();
