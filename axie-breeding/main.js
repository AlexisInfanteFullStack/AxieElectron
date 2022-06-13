const { app, BrowserWindow, shell, ipcMain } = require('electron');
const os = require('os');
const path = require('path')


let mainWindow;
let workerWindow;


function createMainWindow() {

  mainWindow = new BrowserWindow(
    {
      width: 840,
      height: 630,
      minWidth: 840,
      minHeight: 630,
      webPreferences: {

        nodeIntegration: true,
        contextIsolation: false

        // preload: path.join(__dirname, './src/index/preload.js')
      }
    }
  );

  mainWindow.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    shell.openExternal(url);
  });

  mainWindow.loadFile(path.join(__dirname, './src/index/index.html'));
}


function createWorkerWindow() {

  workerWindow = new BrowserWindow(
    {
      show: false,


      width: 800,
      height: 600,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        // preload: path.join(__dirname, './src/worker/worker_preload.js')

        nodeIntegration: true,
        contextIsolation: false

      }
    }
  );

  workerWindow.loadFile(path.join(__dirname, './src/worker/worker.html'));
}







function getInfoOfBuildsToBeMatched(buildsArray) {

  let buildsInfo = `Started matching process for builds: ${os.EOL}${os.EOL}`;
  for (let i = 0; i < buildsArray.length; i++) {
    const build = buildsArray[i];

    buildsInfo += `Name: ${build.name} ___ Id: ${build.id}${os.EOL}`
  }

  return  buildsInfo;
}









app.whenReady().then(() => {

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  });




  // match builds
  ipcMain.handle('matchBuilds', function(event, arg) {

    // create worker window
    createWorkerWindow();

    // send builds to be matched
    workerWindow.webContents.on('did-finish-load', function () {

      workerWindow.webContents.send('matchBuildsWorker', arg);
    });

    // return info of builds to be matched (not actual results)
    return getInfoOfBuildsToBeMatched(arg.builds);
  });





  // handle results after builds are actually matched
  ipcMain.handle('resultsFromWorker', function(event, arg) {
    // arg[i] = {build: buildObj, resultsCreated: [results]}


    // send results to renderer
    mainWindow.webContents.send('resultsFromMain', arg);

    // now that we got the results, destroy worker window
    workerWindow.destroy();

    console.log('workerWindow destroyed automatically from main');
  });



  

  // unmatch builds
  ipcMain.handle('unmatchBuilds', function(event) {

    // destroy worker window
    workerWindow.destroy();

    return 'workerWindow destroyed manually from renderer';
  });


});





app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
});
