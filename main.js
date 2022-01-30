const path = require('path');
const electron = require('electron');
const {app, Menu,dialog,Tray} = require('electron');
const storage = require('./storage');
const os = require("os")
storage.setStoragePath(path.join(os.homedir(),"/.404up.json"))
storage.init();
const ipc = require('electron').ipcMain;
//const autoUpdater = require('./auto-updater');
try {
    require('electron-reloader')(module)
} catch (_) {}
const BrowserWindow = electron.BrowserWindow;


let loginWindow;
const debug = true;
let mainWindow = null;
// /--debug/.test(process.argv[2]);

if (process.mas) {
    app.setName('404.up');
}



const windowOptions = {
    width: 330,
    minWidth: 330,
    height: 260,
    maxWidth:1330,
    maxHeight:1260,
    title: app.getName(),
    webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule:true
    }
};


function initMenus(){
    const template = [
        {
            label: 'Edit',
            submenu: [


                {role: 'cut'},
                {role: 'copy'},
                {role: 'paste'},
                {role: 'pasteandmatchstyle'},
                {role: 'delete'},
                {role: 'selectall'}
            ]
        },
        {
            label: 'View',
            submenu: [
                {role: 'resetzoom'},
                {role: 'zoomin'},
                {role: 'zoomout'},
                {type: 'separator'},
                {role: 'togglefullscreen'}
            ]
        },
        {
            role: 'window',
            submenu: [
                {role: 'minimize'},
                {role: 'close'}
            ]
        },
        {
            role: 'help',
            submenu: [
                {
                    label: 'Learn More',
                    click () { require('electron').shell.openExternal('http://162cm.com/') }
                }
            ]
        }
    ];

    if (process.platform === 'darwin') {
        template.unshift({
            label: "404.up",
            submenu: [
                {role: 'about'},
                {type: 'separator'},
                {role: 'services', submenu: []},
                {type: 'separator'},
                {role: 'hide'},
                {role: 'hideothers'},
                {role: 'unhide'},
                {type: 'separator'},
                {role: 'quit'}
            ]
        })

        // Edit menu
        template[1].submenu.push(
            {type: 'separator'},
            {
                label: 'Speech',
                submenu: [
                    {role: 'startspeaking'},
                    {role: 'stopspeaking'}
                ]
            }
        )

        // Window menu
        template[2].submenu = [
            {role: 'resetzoom'},
            {role: 'zoomin'},
            {role: 'zoomout'},
            {type: 'separator'},
            {role: 'togglefullscreen'}
        ]
    }

    if(!debug) {
        const menu = Menu.buildFromTemplate(template)
        app.setApplicationMenu(menu)
    }
}
function createMainWindow(){
    if(mainWindow!=null){
        return
    }
    mainWindow = new BrowserWindow(windowOptions)
    mainWindow.loadURL(path.join('file://', __dirname, '/index.html'))

    // Launch fullscreen with DevTools open, usage: npm run debug
    if (debug) {
        mainWindow.webContents.openDevTools()
        mainWindow.maximize()
        //require('devtron').install()
    }

    mainWindow.on('closed', function () {
        mainWindow = null
    });

}
function createLoginWindow(){
    if(loginWindow!=null){
        return
    }
    loginWindow = new BrowserWindow({
        height:600,
        width:800,
        webPreferences: {
            preload: path.join(__dirname, 'loginPreload.js'),
            nodeIntegration: true,
            contextIsolation: true,
            enableRemoteModule:true
        }
    });
    loginWindow.loadURL(path.join('file://', __dirname, '/login.html'));
    loginWindow.on('closed', function () {
        loginWindow = null
    });
}
function createWindow () {
    if (process.platform === 'linux') {
        windowOptions.icon = path.join(__dirname, '/assets/icons/mac/icon.png')
    }
    let token = storage.getItem("token")
    if (token == null||token === ""){
        createLoginWindow();
    }else{
        createMainWindow();
    }
    initMenus()
}


function closeLoginWindow(){
    if(loginWindow!=null){
        try{
            loginWindow.hide();
            loginWindow = null;
        }catch (e) {

        }
    }
}

function closeMainWindow(){
    if(mainWindow!=null){
        try{
            mainWindow.hide();
            mainWindow = null;
        }catch (e) {

        }
    }
}

function initialize () {
  let shouldQuit = makeSingleInstance()
  if (shouldQuit) return app.quit()

  loadDemos()


  app.on('ready', function () {
    createWindow();

    //#autoUpdater.initialize()
  });

  app.on('window-all-closed', function () {
      app.quit()
  });

  app.on('activate', function () {
    if (mainWindow === null) {
      createWindow()
    }
  })
}

// Make this app a single instance app.
//
// The main window will be restored and focused instead of a second window
// opened when a person attempts to launch a second instance.
//
// Returns true if the current version of the app should quit instead of
// launching.
function makeSingleInstance () {
  if (process.mas) return false

	/*
  return app.makeSingleInstance(function () {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })*/
}

// Require each JS file in the main-process dir
function loadDemos () {
  //autoUpdater.updateMenu()
}

// Handle Squirrel on Windows startup events
switch (process.argv[1]) {
  case '--squirrel-install':
    autoUpdater.createShortcut(function () { app.quit() })
    break
  case '--squirrel-uninstall':
    autoUpdater.removeShortcut(function () { app.quit() })
    break
  case '--squirrel-obsolete':
  case '--squirrel-updated':
    app.quit()
    break
  default:
    initialize()
}
ipc.on("need-login",()=>{
    console.log("need-login msg got")
    try{
        createLoginWindow();
        closeMainWindow();
    }
    catch (e){
    }

});

ipc.on("update-token",(event, args)=>{
    console.log("got token")
    storage.sync();
    let succ = storage.setItem("token",args[0])
    console.log("save succ:")
    console.log(succ)
    try {
        createMainWindow();
        closeLoginWindow();
    }catch (e) {

    }

})
ipc.on('open-file-dialog-for-file', function (event) {
    if(os.platform() === 'linux' || os.platform() === 'win32'){
        dialog.showOpenDialog({
            properties: ['openFile']
        }, function (files) {
            if (files) event.sender.send('selected-file', files[0]);
        });
    } else {
        dialog.showOpenDialog({
            properties: ['openFile', 'openDirectory']
        }).then ( files => {
            console.log(files);
            if (files) event.sender.send('selected-file', files);
        });
    }});