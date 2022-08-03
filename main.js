// Modules to control application life and create native browser window
const electron = require('electron');
const { app, BrowserWindow, ipcMain, Tray, globalShortcut, Menu  } = electron;
//const edge = require('electron-edge-js');
//var beep = edge.func(require('path').join(__dirname, 'beep.cs'));
var Positioner = require('electron-positioner');
var connectivity = require('connectivity');
const debug = require('electron-debug');
const WebSocket = require('ws');
let wss = new WebSocket.Server({ port: 1040 });

const { autoUpdater } = require("electron-updater");

let updateWin;

function sendStatusToWindow(text) {
  updateWin.webContents.send("message", text);
}

function createDefaultUpdaetWindow() {
  updateWin = new BrowserWindow({
    backgroundColor: "#eeeeee",
    webPreferences: { nodeIntegration: true },
  });

  updateWin.on("closed", () => {
    updateWin = null;
  });
  updateWin.loadURL(`file://${__dirname}/version.html#v${app.getVersion()}`);
  return updateWin;
}

autoUpdater.on("checking-for-update", () => {
  sendStatusToWindow("Checking for update...");
});
autoUpdater.on("update-available", (info) => {
  sendStatusToWindow("Update available.");
});
autoUpdater.on("update-not-available", (info) => {
  sendStatusToWindow("Update not available.");
});
autoUpdater.on("error", (err) => {
  sendStatusToWindow("Error in auto-updater. " + err);
});
autoUpdater.on("download-progress", (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + " - Downloaded " + progressObj.percent + "%";
  log_message = log_message + " (" + progressObj.transferred + "/" + progressObj.total + ")";
  sendStatusToWindow(log_message);
});
autoUpdater.on("update-downloaded", (info) => {
  sendStatusToWindow("Update downloaded");

  const option = {
    type: "question",
    buttons: ["업데이트", "취소"],
    defaultId: 0,
    title: "electron-updater",
    message: "업데이트가 있습니다. 프로그램을 업데이트 하시겠습니까?",
  };
  let btnIndex = dialog.showMessageBoxSync(updateWin, option);

  if(btnIndex === 0) {
    autoUpdater.quitAndInstall();
  }
});

//에러가 alert이 아니게 나오게끔한다.
process.on('uncaughtException', function (error) {
  console.log(`[WebSocket]err=${JSON.stringify(error)}`);
});

const isWin = process.platform === 'win32';

// Don't show the app in the doc

if (!isWin) app.dock.hide();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let popupWindow;
let aMonWindow;
let aMonSetWindow;
let aMonCcmWindow;

let tray = null;
let wsId = 0;
let wsList = [];
let electronScreen;

let loginInfo = null;

function createWindow() {


  // Create the browser window.
  electronScreen = electron.screen;
  globalShortcut.register('Ctrl+Shift+X', () => {
    // Ctrl/Shift X 가 눌렸을 때 할 동작.
    app.isQuiting = true;
    app.quit();
  });
  let trayIcon = '';
  if (isWin) {
    trayIcon = 'matrixtalk.ico';
  } else {
    trayIcon = 'Icon.png';
  }

  tray = new Tray(__dirname + `/${trayIcon}`);
  tray.setToolTip('MatrixCloud ');

  let trayMenuTemplate = null;

  if (isWin) {
    trayMenuTemplate = [
      {
        label: '종료',
        click: function () {
          app.isQuiting = true;
          app.quit();
        },
      },
    ];
  } else {
    trayMenuTemplate = [
      {
        label: 'MatrixCloud 열기',
        click: function () {
          mainWindow.show();
        },
      },
      {
        label: '종료',
        click: function () {
          app.isQuiting = true;
          app.quit();
        },
      },
    ];
  }

  let trayMenu = Menu.buildFromTemplate(trayMenuTemplate);
  tray.setContextMenu(trayMenu);
  mainWindow = new BrowserWindow({
    resizable: false,
    alwaysOnTop: false,
    width: 250,
    height: 500,
    maximizable: false,
    minimizable: false,
    //transparent: true,
    autoHideMenuBar: true,
    frame: true, //프레임 유무
    icon: trayIcon,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // var positioner = new Positioner(mainWindow);
  // Moves the window top right on the screen.
  //positioner.move('bottomRight')
  mainWindow.setMenu(null); //디버그 타이틀 없애기
  //mainWindow.setResizable(true); //창크기 조절창 보이기
  //mainWindow.setTitle(' ');
  mainWindow.setMinimizable(false);
  //mainWindow.setMaximizable(false);
  //mainWindow.setSize(250, 500);
  mainWindow.setMovable(true);
  //console.log(edge);
  // and load the index.html of the app.
  //mainWindow.loadFile('index.html');
  mainWindow.loadURL('https://zdphone01.matrixcloud.co.kr');


  setInterval(function() {
//checkNetWork(mainWindow);
  }, 1000 )



const checkNetWork = (mainWindow) => {
  connectivity(function (online) {
    if (online) {
      console.log('connected to the internet!')
    } else {
      console.error('sorry, not connected!')
      
      mainWindow.loadFile('404.html')
    }
  })
}



  //mainWindow.webContents.openDevTools()

  // Open the DevTools.
  mainWindow.webContents.openDevTools() //콘솔창

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  //websockets
  wss.on('connection', function (w) {
    w.id = wsId++;
    console.log(w.id);
    wsList[w.id] = w;

    w.on('message', function (data) {
      console.log(data);

      const wsData = (data && JSON.parse(data)) || null;

      if (wsData) {
        const { cmd, tel = '' } = wsData;
        if (cmd === 'dailEx') {
          console.log('tel = ', tel);
          if (tel) {
            mainWindow.show();
            mainWindow.setAlwaysOnTop(true);
            mainWindow.webContents.executeJavaScript(`keypad();`);
            mainWindow.webContents.executeJavaScript(`EE('obMode');`);
            mainWindow.webContents.executeJavaScript(`zenDialEx('${tel}');`);
          } else {
            mainWindow.show();
            mainWindow.setAlwaysOnTop(true);
            mainWindow.webContents.executeJavaScript(`keypad();`);
            mainWindow.webContents.executeJavaScript(`EE('obMode');`);
            mainWindow.setAlwaysOnTop(false);
          }
        } else {
          w.send(JSON.stringify({ cmd: 'login', data: { login: true } }));
          mainWindow.webContents.executeJavaScript(
            "changeZdStatus('#419C2A');",
          );
          mainWindow.webContents.executeJavaScript('ipcLoginAfter();');
          if (loginInfo) w.send(JSON.stringify({ ...loginInfo }));
        }
      }
    });
    w.on('close', function () {
      mainWindow.webContents.executeJavaScript("changeZdStatus('#7f7f7f');");
      console.log('Closed');
    });
    w.send(JSON.stringify({ cmd: 'init', data: { init: true } }));
  });

  mainWindow.on('close', function (event) {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }

    return false;
  });

  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
  
}


const shouldQuit = app.requestSingleInstanceLock();

// const shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
//애플리케이션을 중복 실행했습니다. 주 애플리케이션 인스턴스를 활성화 합니다.
// if (mainWindow) {
// if (mainWindow.isMinimized()) myWindow.restore();
// mainWindow.focus();
// }
// });

if (!shouldQuit) {
  app.quit();
}else{
  if (mainWindow) {
    if (mainWindow.isMinimized() || !mainWindow.isVisible()) {
      mainWindow.show();
    }
    mainWindow.focus();
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

app.on('ready', async () => {
  createWindow();
  createDefaultUpdaetWindow();
  autoUpdater.checkForUpdates();
});


// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
var g_client = null;

function fnIngConnWs() {
  let tmpConnWs = null;
  for (let index = 0; index < wsList.length; index++) {
    const tmpWs = wsList[index];
    console.log('tmpWs.readyState = ', tmpWs.readyState);
    if (tmpWs.readyState === 1) {
      tmpConnWs = tmpWs;
      break;
    }
  }
  return tmpConnWs;
}

/************************* Websocket IPC Start*************************/
ipcMain.on('ipcIncommingCall', (event, arg) => {
  console.log('wsId = ', wsId);
  console.log(arg);

  let tmpConnWs = fnIngConnWs();
  if (tmpConnWs) tmpConnWs.send(JSON.stringify(arg));
});

ipcMain.on('ipcHangupCall', (event, arg) => {
  console.log('wsId = ', wsId);
  console.log(arg);
  let tmpConnWs = fnIngConnWs();
  if (tmpConnWs) tmpConnWs.send(JSON.stringify(arg));
});

ipcMain.on('ipcTransferCall', (event, arg) => {
  console.log('wsId = ', wsId);
  console.log(arg);
  let tmpConnWs = fnIngConnWs();
  if (tmpConnWs) tmpConnWs.send(JSON.stringify(arg));
});

ipcMain.on('ipcLoginAfter', (event, arg) => {
  console.log('wsId = ', wsId);

  loginInfo = arg;
  console.log('loginInfo.cmd = ', loginInfo.cmd); //오브젝트인가
  let tmpConnWs = fnIngConnWs();
  if (tmpConnWs) tmpConnWs.send(JSON.stringify(arg));
});

ipcMain.on('checkZdSocket', (event, arg) => {
  let tmpConnWs = fnIngConnWs();
  if (tmpConnWs) {
    mainWindow.webContents.executeJavaScript("changeZdStatus('#419C2A');");
  } else {
    mainWindow.webContents.executeJavaScript("changeZdStatus('#7f7f7f');");
  }
});

/************************* Websocket IPC End*************************/

ipcMain.on('request-mainprocess-action2', (event, arg) => {
  //console.log('request-mainprocess-action2');
  //mainWindow.setSize(250, 500 );  //화면사이즈 원복
  //mainWindow.setBounds({ width:250, height:500 })
  //현재의 컴퓨터 모니터의 사이즈를 가져옴
  let display = electronScreen.getPrimaryDisplay();
  //console.log(display);
  //그중 작업표시줄을 제외한 사이즈를 가져옴. workAreaSize = {width, height}
  let { workAreaSize } = display;
  //console.log(workAreaSize);
  //현재 띄운 electron의 위치를 가져옴
  let winCurPosition = mainWindow.getPosition();
  //사이즈 변경
  //console.log(workAreaSize);
  mainWindow.setContentSize(250, 500);
  mainWindow.setAlwaysOnTop(false);
  //1920x1080 에서는, 515넘어가면 안보이기 시작.
  // 위치가 515를 넘어가면 x 는 그대로 두고, y에서 530을 빼 위로 올림. 수치는 조정 바람
  // 과제... 각 모니터 사이즈별로 어떻게 처리할 지 고민해볼것

  if (display.size.width == 3840 && winCurPosition[1] > 1600) {
    //4k 모니터
    console.log('3840*2160');

    mainWindow.setPosition(winCurPosition[0], workAreaSize.height - 530);

    console.log('3840');

    return;
  }

  if (display.size.width == 1920) {
    //FHD 모니터
    console.log('1920*1080');
    if (winCurPosition[1] > 515) {
      mainWindow.setPosition(winCurPosition[0], workAreaSize.height - 530);

      console.log('1920');
    }

    return;
  }

  if (display.size.width == 2560) {
    //QHD모니터
    console.log('2560*1440');
    if (winCurPosition[1] > 875) {
      mainWindow.setPosition(winCurPosition[0], workAreaSize.height - 530);

      console.log('2560');
    }

    return;
  }
});

ipcMain.on('request-mainprocess-action3', (event, arg) => {
  let display = electronScreen.getPrimaryDisplay();

  let { workAreaSize } = display;

  let winCurPosition = mainWindow.getPosition();

  mainWindow.setContentSize(250, 68); //화면사이즈 축소
  mainWindow.setAlwaysOnTop(true);

  if (display.size.width == 3840) {
    //4k 모니터
    console.log('3840*2160');
    if (winCurPosition[1] > 1580) {
      mainWindow.setPosition(winCurPosition[0], 2020);

      console.log('3840');
    }
    return;
  }

  if (display.size.width == 1920) {
    //FHD 모니터
    console.log('1920*1080');
    if (winCurPosition[1] > 505) {
      mainWindow.setPosition(winCurPosition[0], 940);

      console.log('1920');
    }

    return;
  }

  if (display.size.width == 2560) {
    //QHD모니터
    console.log('2560*1440');
    if (winCurPosition[1] > 868) {
      mainWindow.setPosition(winCurPosition[0], 1300);

      console.log('2560');
    }

    return;
  }
});

ipcMain.on('request-mainprocess-action4', (event, arg) => {
  //링이벤트카 들어올떄
  mainWindow.setAlwaysOnTop(true);
});

ipcMain.on('request-mainprocess-action5', (event, arg) => {
  //링이벤트카 끊어질때
  mainWindow.setAlwaysOnTop(false);
});

ipcMain.on('request-mainprocess-action6', (event, arg) => {
  //tray로 숨었을때 복원
  mainWindow.show();
});


ipcMain.on('request-mainprocess-action7', (event, arg) => {
  //화면닫기
  app.isQuiting = true;
  app.quit();
});

ipcMain.on('request-mainprocess-action8', (event, arg) => {
  //재접속
  mainWindow.loadURL('https://zdphone01.matrixcloud.co.kr');

});


ipcMain.on('aways-top-set', (event, arg) => {
  mainWindow.setAlwaysOnTop(arg);
});

ipcMain.on('agent-mon-set', (event, arg) => {
  //console.log(String(arg));
  //console.log('aegnt-monitor-set = ', JSON.stringify(arg));
  aMonWindow.webContents.executeJavaScript('afterCol();');
  aMonSetWindow.close();
});

ipcMain.on('softphone-logout', (event, arg) => {
  app.isQuiting = true;
  app.quit();
});







  



