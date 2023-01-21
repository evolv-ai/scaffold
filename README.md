# Scaffold (@catalyst)

Scaffolding for developing and building an experiment using rollup

The `main` branch represents a plain version independent of tech stack. Each branch below provides a scaffold for specific frameworks and integrations.

| Branch name   | Integration supports | Integration plugin Requirements |
| ------------- | -------------------- | ------------------------------- |
| @lit          | Uses lit templating  | https://www.npmjs.com/package/@evolv-delivery/lit-harness |
| @mutate       | Uses mutate lib      | NA - Built in                                             |
| @mutate-lit   | Uses lit templating  | https://www.npmjs.com/package/@evolv-delivery/lit-harness |
| **@catalyst** | **Uses Catalyst 0.6.0+** | **https://www.npmjs.com/package/@evolv-delivery/catalyst** |
| @catalyst-lit | Users Catalyst & lit | https://www.npmjs.com/package/@evolv-delivery/lit-harness<br>https://www.npmjs.com/package/@evolv-delivery/catalyst |

## Getting Started

### Initialize project

To start a new project in the `new-project` directory:

```zsh
npx degit git@github.com:evolv-ai/scaffold.git@catalyst --mode=git new-project
cd new-project
npm install
```

Edit `evolv.config.js` and configure it for your project.

**Note**: _Make sure you update the context id, reference url, and web.url value._

Once you have your experiment outline specified, run the following to build your folder structure:

```zsh
npm run scaffold
```

### Build YAML

To export YAML without starting a dev server:

```zsh
npm run build
```

Your YAML file will be generated in the `./export` folder and the file name is specified in `evolv.config.js`.

### Start Development Server

To start the development server on port `8080`. When the dev server is running your YAML file will update on every file change.

```zsh
npm start
```

## Setup Resource Override

There is a chrome extension in development, but is not ready for use in experiment development yet. So, in the meantime, we need to setup Resource Override to handle loading our harness for execution.

### Install Resource Override

Install from: https://chrome.google.com/webstore/detail/resource-override/pkoacgokdfckfpndoffpifphamojphii?hl=en

### Tab Group

Add tab group url for the path you want to load the variants into. You can use either a base url (https://www.evolv.ai/**) or a specific path.

#### Add Inject file rule

Add an Inject file to your tab group and use the default `head` as the insertion point.
The following snippet should be used as the content.

```js
(function () {
    var variants = ['context1/c1/v1']; // Change context and variant names to fit your project
    var port = '8080';

    var script = document.createElement('script');
    script.setAttribute('src', `http://localhost:${port}/local-loader.js`);
    script.setAttribute('variants', JSON.stringify(variants));
    script.setAttribute('port', port);

    document.head.appendChild(script);
})()
```

**Note**: The variants can be any combination where each variant string is specified by the following `<context id>/<concept id>/<variant id>`.