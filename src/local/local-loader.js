(function localLoader() {
  // Load and run variants
  const variants = JSON.parse(document.currentScript.getAttribute('variants'));
  const port =
    JSON.parse(document.currentScript.getAttribute('port')) || '8080';
  const url = `http://localhost:${port}`;
  const prefix = '[evolv-local] loader:';

  function waitFor(check, invoke, poll) {
    if (check()) {
      invoke();
      return;
    }
    let polling = setInterval(() => {
      try {
        if (check()) {
          invoke();
          clearInterval(polling);
          polling = null;
        }
      } catch (e) {
        console.info(prefix, 'listener not processed');
      }
    }, poll.interval);
    setTimeout(() => {
      if (!polling) return;

      clearInterval(polling);
      console.info(prefix, 'render listener timeout', poll);
      window.evolvRenderTimeout = {
        msg: 'evolv render listener timeout',
        poll,
      };
    }, poll.duration);
  }

  function loadScript(path) {
    const scriptNode = document.createElement('script');
    scriptNode.setAttribute('src', path);

    return new Promise((resolve) => {
      scriptNode.addEventListener('load', () => requestAnimationFrame(resolve));
      document.head.appendChild(scriptNode);
    });
  }

  function loadStyles(path) {
    // Link rel="stylesheet" href="styles.css"
    const styleNode = document.createElement('link');
    styleNode.setAttribute('rel', 'stylesheet');
    styleNode.setAttribute('href', path);
    document.head.appendChild(styleNode);
  }

  function applyVariants(poll = { duration: 900000, interval: 250 }) {
    function getRule() {
      return window.evolv && window.evolv.renderRule;
    }

    function loadVariants() {
      console.info(prefix, 'loading context');

      const contextId = variants[0].match(/[A-Za-z0-9\-_]+(?=\/)/)[0];

      const contextLoaded = loadScript(`${url}/${contextId}/context.js`);
      loadStyles(`${url}/${contextId}/context.css`);

      contextLoaded.then(() => {
        variants.forEach((v) => {
          console.info(prefix, 'loading variant', v);

          loadScript(`${url}/${v}.js`);
          loadStyles(`${url}/${v}.css`);
        });
      });
    }

    waitFor(getRule, loadVariants, poll);
  }

  applyVariants();

  console.info(prefix, 'loading complete');
})();
