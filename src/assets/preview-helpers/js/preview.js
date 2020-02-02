(function () {
    const outputDiv = document.querySelector('#consoleOutput');
    const sourceIframe = document.querySelector('#sourceCode');

    const originalConsoleLog = console.log;
    console.log = function () {
        originalConsoleLog.call(this, arguments);
        const argString = [].concat([...arguments]).join(' ');
        outputDiv.innerHTML += 'Log: ' + argString + '<br/>';
    }

    const originalConsoleError = console.error;
    console.error = function () {
        originalConsoleError.call(this, arguments);
        const argString = [].concat([...arguments]).join(' ');
        outputDiv.innerHTML += 'Error: ' + argString + '<br/>';
    }

    window.onerror = function (msg, url, line) {
        console.error([].concat([...arguments]).join(' '));
    };

    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('src');

    sourceIframe.src = source;

    console.log('INTERNAL - Loading script');
    fetch(source).then((response) => {
        console.log('INTERNAL - Loaded script');
        response.text().then((t) => {
            console.log('INTERNAL - Executing script');
            try {
                eval(t);
            } catch (e) {
                console.error(e);
            }
        });
    });
})();