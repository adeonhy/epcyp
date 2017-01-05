import electron from 'electron'
import request from 'superagent'
import path from 'path'
import Config from 'electron-config'
import loadDevTool from 'electron-load-devtool'
import {exec} from 'child_process'
const ipcMain = electron.ipcMain
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const config = new Config({
  defaults: { bounds: { width: 800, height: 600 } }
})

var mainWindow = null
var settingsWindow = null
var favoriteWindow = null

// 起動準備ができた時
app.on('ready', ()=>{
  const {width, height, x, y} = config.get('bounds')
  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    minWidth: 150,
    x: x,
    y: y,
    frame: false,
    titleBarStyle: 'hidden-inset',
    scrollBounce: true
  })
  // loadDevTool(loadDevTool.REACT_DEVELOPER_TOOLS)
  // mainWindow.openDevTools()
  mainWindow.loadURL(`file://${path.resolve(path.join('dist', 'index.html'))}`)

  mainWindow.on('close', ()=>{
    config.set('bounds', mainWindow.getBounds())
    mainWindow = null
  })
})

// すべてのウィンドウが閉じた時
app.on('window-all-closed', ()=>{
  if(process.platform != 'darwin') app.quit()
})

// index.txtの取得
ipcMain.on('asyn-yp', (event, yp)=>{
  request.get(yp.url).end((err,res)=>{
    try{
      if(res.status == 200 && !res.error){
        yp["txt"] = res.text
      }else{
        yp["txt"] = null
        console.log(res.error)
      }
      event.sender.send('asyn-yp-reply', yp)
    }catch(e){
      console.log(e)
    }
  })
})

// プレイヤーの起動
ipcMain.on('asyn-play', (event, url) =>{
  var command = `open -a ${config.get('player')} ${url}`
  exec(command, (error, stdout, stderr)=>{
    console.log(stdout)
  })
})

// BBSブラウザの起動
ipcMain.on('asyn-open-bbs', (event, url) =>{
  var command = `open -a ${config.get('bbs')} ${url}`
  exec(command, (error, stdout, stderr)=>{
    console.log(stdout)
  })
})

// お気に入りウィンドウを開く
ipcMain.on('asyn-favorite-window', (event) =>{
  favoriteWindow = new BrowserWindow({
    width: 480,
    height: 370,
    frame: false,
    alwaysOnTop: true,
    resizable: false
  })
  favoriteWindow.loadURL(`file://${path.resolve(path.join('dist', 'favorite.html'))}`)
  mainWindow.setIgnoreMouseEvents(true)
})
// お気に入りウィンドウを閉じる
ipcMain.on('asyn-favorite-window-close', (event) =>{
  favoriteWindow.close()
  favoriteWindow = null
  mainWindow.setIgnoreMouseEvents(false)
  mainWindow.send('asyn-favorite-window-close-reply')
})

// 設定ウィンドウを開く
ipcMain.on('asyn-settings-window', (event) =>{
  settingsWindow = new BrowserWindow({
    width: 400,
    height: 400,
    frame: false,
    alwaysOnTop: true,
    resizable: false
  })
  settingsWindow.loadURL(`file://${path.resolve(path.join('dist', 'settings.html'))}`)
  mainWindow.setIgnoreMouseEvents(true)
})
// 設定ウィンドウを閉じる
ipcMain.on('asyn-settings-window-close', (event) =>{
  settingsWindow.close()
  settingsWindow = null
  mainWindow.setIgnoreMouseEvents(false)
  mainWindow.send('asyn-settings-window-close-reply')
})
