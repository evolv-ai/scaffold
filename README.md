# Scaffold (@catalyst)

Scaffolding for developing and building an experiment using rollup

The `main` branch represents a plain version independent of tech stack. Each branch below provides a scaffold for specific frameworks and integrations.

| Branch name   | Integration supports | Integration plugin Requirements                                                                                     |
| ------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| @lit          | Uses lit templating  | https://www.npmjs.com/package/@evolv-delivery/lit-harness                                                           |
| @mutate       | Uses mutate lib      | NA - Built in                                                                                                       |
| @mutate-lit   | Uses lit templating  | https://www.npmjs.com/package/@evolv-delivery/lit-harness                                                           |
| **@catalyst** | **Uses Catalyst**   | **https://www.npmjs.com/package/@evolv-delivery/catalyst**                                                          |
| @catalyst-lit | Users Catalyst & lit | https://www.npmjs.com/package/@evolv-delivery/lit-harness<br>https://www.npmjs.com/package/@evolv-delivery/catalyst |

## Generating a project

To start a new project in the `my-project` directory with the scaffold:

`npx degit git@github.com:evolv-ai/scaffold.git@catalyst --mode=git my-project`

## Initialize project

Then got into the folder:

`cd my-project`

And then, run:

`npm install`

Now you are all ready to develop your project

## Create your folders with json

To create your folders (and scaffolded files) for the project, edit the `evolv-config.json`.

**Note**: _Make sure you update the context id, reference url, and web.url value._

Once you have your experiment outline specified in the json, run the following to build your folder structure:

`npm run init:project`

## Start Development Server

This starts the development server to be served up to the browser.

```
npm start
```

## Setup Resource Override

There is a chrome extension in development, but is not ready for use in experiment development yet. So, in the meantime, we need to setup Resource Override to handle loading our harness for execution.

### Install Resource Override

Install from: https://chrome.google.com/webstore/detail/resource-override/pkoacgokdfckfpndoffpifphamojphii?hl=en

### Tab Group

Add tab group url for the path you want to load the variants into. You can use either a base url (https://www.evolv.ai/**) or a specific path.

#### Add Change Header Rule

Use `Allow Outside Content` from the preset options and it should include two lines with:
`Remove` `Content-Security-Policy` and
`Remove` `X-Content-Security-Policy`

#### Add Inject file rule

Add an Inject file to your tab group and use the default `head` as the insertion point.
The following snippet should be used as the content.

```
var variants = ['context1/c1/v1']; // Change context and variant names to fit your project
var port = '8080';

var expScript = document.createElement('script');
expScript.setAttribute('src', `http://localhost:${port}/local-loader.js`);
expScript.setAttribute('variants', JSON.stringify(variants));
expScript.setAttribute('port', port);

document.head.appendChild(expScript);
```

**Note**: The variants can be any combination where each variant string is specified by the following `<context id>/<concept id>/<variant id>`.

## Build YAML file

The metamodel is generated in the `export` folder every time you build. When the development server is active it updates the YML every time there is a file change.

```zsh
npm run build
```
