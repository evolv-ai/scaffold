import fs from 'fs';
import evolvConfig from '../evolv.config.js';

const version =
  typeof evolvConfig.version === 'number'
    ? evolvConfig.version
    : evolvConfig.version || '';

evolvConfig.contexts.forEach((context) => {
  const { id } = context;
  const sassID = `${id}${version}`;
  const file = `./src/contexts/${id}/_imports/_id.scss`;
  const contents = `$id: ${sassID}`;

  console.log('write', file);
  fs.writeFileSync(file, contents);
});
