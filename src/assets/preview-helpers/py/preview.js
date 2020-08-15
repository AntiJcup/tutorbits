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
  const base = urlParams.get('base');
  const target = urlParams.get('target');
  const otherPaths = JSON.parse(decodeURIComponent(urlParams.get('otherPaths')));
  const allPaths = [target, ...(otherPaths || [])];
  const server = decodeURIComponent(urlParams.get('server'));
  const source = decodeURIComponent(`${base}/${target}`);

  // sourceIframe.src = source;

  console.log('INTERNAL - Connecting...');
  const serverConnection = new WebSocket(server);
  let serverConnectionResolve = null;
  const serverConnectionPromise = new Promise((resolve) => {
    serverConnectionResolve = resolve;
  });

  serverConnection.onopen = (e) => {
    console.log('INTERNAL - Connected');
    serverConnectionResolve();
  };

  const sources = {};
  const loadPromises = [serverConnectionPromise];
  for (const pathIndex in allPaths) {
    const source = decodeURIComponent(`${base}/${target}`);
    const path = allPaths[pathIndex];
    console.log(`INTERNAL - Loading script: ${path}`);
    loadPromises.push(new Promise((resolve) => {
      fetch(source).then((response) => {
        console.log(`INTERNAL - Loaded script: ${path}`);
        response.text().then((t) => {
          sources[path] = t;
          if(target === path) {
            sourceIframe.srcdoc = t;
          }
          resolve();
        });
      })
    }));
  }

  // TODO improve error handling with above requests
  Promise.all(loadPromises).then(() => {
    console.log(`INTERNAL - Finished Initialization`);

    const id = Math.random() * 1000000000;

    serverConnection.onmessage = (e) => {
      const parsedData = JSON.parse(e.data);
      if (parsedData['type'] === 'previewFinish') {
        console.log(`INTERNAL - Completed`);
        return;
      }

      switch (parsedData['source']) {
        case 'stdout':
          console.log(`INTERNAL - Recieved Output: ${parsedData['data']}`);
          break;
        case 'stderr':
          console.log(`INTERNAL - Recieved Error: ${parsedData['data']}`);
          break;
      }

    };

    const primarySource = sources[target];
    delete sources[target];

    // Send preview command to server
    const cmd = {
      type: 'preview',
      primarySource,
      sources,
      id
    };
    serverConnection.send(JSON.stringify(cmd));
    console.log(`INTERNAL - Running`);
  }).catch((e) => {
    console.error(`INTERNAL - ISSUE ${e}`);
  });

})();
