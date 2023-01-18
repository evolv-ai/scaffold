(function () {
    //load and run variants
    var variants = JSON.parse(document.currentScript.getAttribute('variants'));
    var port =
        JSON.parse(document.currentScript.getAttribute('port')) || '8080';
    var url = `http://localhost:${port}`;
    var prefix = '[evolv-local] loader:';

    applyVariants(url, variants);

    function applyVariants(folder, variants, poll) {
        poll = poll || { duration: 900000, interval: 250 };

        function getRule() {
            return window.evolv && window.evolv.renderRule;
        }

        function loadVariants() {
            console.info(prefix, 'loading context');

            const contextId = variants[0].match(/[A-Za-z0-9\-_]+(?=\/)/)[0];

            let contextLoaded = loadScript(`${folder}/${contextId}/context.js`);
            loadStyles(`${folder}/${contextId}/context.css`);

            contextLoaded.then(() => {
                variants.forEach((v) => {
                    console.info(prefix, 'loading variant', v);

                    loadScript(`${folder}/${v}.js`);
                    loadStyles(`${folder}/${v}.css`);
                });
            });
        }

        waitFor(getRule, loadVariants, poll);
    }

    function loadScript(path) {
        var scriptNode = document.createElement('script');
        scriptNode.setAttribute('src', path);

        return new Promise((resolve, reject) => {
            scriptNode.addEventListener('load', () =>
                requestAnimationFrame(resolve)
            );
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

        function getRule() {
            return window.evolv && window.evolv.renderRule;
        }

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
            } catch (e) {
                console.info(prefix, 'listener not processed');
            }
        }, poll.interval);
        setTimeout(function () {
            if (!polling) return;

            clearInterval(polling);
            console.info(prefix, 'render listener timeout', poll);
            window.evolvRenderTimeout = {
                msg: 'evolv render listener timeout',
                poll: poll,
            };
        }, poll.duration);
    }
    console.info(prefix, 'loading complete');
})();
