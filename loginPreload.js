const electron = require("electron")
const ipc = require('electron').ipcRenderer
const { contextBridge } = require('electron')
contextBridge.exposeInMainWorld("setToken",(token)=>{
    ipc.send("update-token",[token]);
});
contextBridge.exposeInMainWorld("ipc",ipc);