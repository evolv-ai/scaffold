(function () {
  //load and run variants
  var variants = JSON.parse(document.currentScript.getAttribute('variants'))
  var port = JSON.parse(document.currentScript.getAttribute('port')) || '8080';
  var url = `http://localhost:${port}/`;
  applyVariants(url, variants);

  //
  function applyVariants(folder, variants, poll) {
    poll = poll || { duration: 900000, interval: 250 };

    function getRule() { return window.evolv && window.evolv.renderRule };

    function loadVariants() {
      console.info('loading context')

      if (!variants || variants.length === 0) {
        console.info('variants are invalid', variants)
      }
      var context = 'context';
      var contextMatch = variants[0].match(/^([a-z,A-Z,0-9]*)\//);
      if (contextMatch){
        context = contextMatch[1];
      }

      let contextLoaded = loadScript(`${folder}/${context}/context.js`)
      loadStyles(`${folder}/${context}/context.css`)

      contextLoaded.then(() => {
        variants.forEach(v => {
          console.info('loading variant', v);

          loadScript(`${folder}${v}.js`);
          loadStyles(`${folder}${v}.css`);
        })
      });
    }

    waitFor(getRule, loadVariants, poll);
  }

  function loadScript(path) {
    var scriptNode = document.createElement('script');
    scriptNode.setAttribute('src', path);

    return new Promise((resolve, reject) => {
      scriptNode.addEventListener('load', () => requestAnimationFrame(resolve));
      document.head.appendChild(scriptNode);
    });
  }

  function loadStyles(path) {
    //link rel="stylesheet" href="styles.css"
    var styleNode = document.createElement('link');
    styleNode.setAttribute('rel', 'stylesheet');
    styleNode.setAttribute('href', path);
    document.head.appendChild(styleNode);
  }

  function listenToEvents(config) {
    var poll = config.poll || { duration: 300000, interval: 250 };

    function getRule() { return window.evolv && window.evolv.renderRule };

    waitFor(getRule, inject, poll);
  }

  function waitFor(check, invoke, poll) {
    if (check()) {
      invoke();
      return;
    }
    var polling = setInterval(function () {
      try {
        if (check()) {
          invoke();
          clearInterval(polling);
          polling = null;
        }
      } catch (e) { console.info('listener not processed') }
    }, poll.interval);
    setTimeout(function () {
      if (!polling) return

      clearInterval(polling)
      console.info('evolv render listener timeout', poll)
      window.evolvRenderTimeout = {
        msg: 'evolv render listener timeout', poll: poll
      }
    }, poll.duration)
  };
  console.info('evolv harness loaded');
})();