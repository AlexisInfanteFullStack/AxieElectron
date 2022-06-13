const { app, BrowserWindow } = require('electron');
const path = require('path')


let mainWindow;

function createMainWindow() {

  mainWindow = new BrowserWindow(
    {
      width: 1024,
      height: 576,
      minWidth: 960,
      minHeight: 540,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    }
  );

  mainWindow.loadFile(path.join(__dirname, './src/index/index.html'));
}



app.whenReady().then(() => {

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  });

});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
});
