# scaffold
Scaffolding for developing and building an experiment using rollup


## Generating a project
To start a new project named `myProject` with the scaffold, use the following command line:

```npx degit git@github.com:evolv-ai/scaffold.git --mode=git myProject```

Then got into the folder:

```cd myProject```

And then, run:

```npm install```

Now you are all ready to develop your project

## Create your folders with json

To create your folders (and scaffolded files) for the project, edit the `evolv-config.json`
Once you have your experiment outline specified in the json, run the following to build your folder structure:

```npm run folder:build```

