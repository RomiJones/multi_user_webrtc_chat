var platform = require('os').platform();

const electron = require("electron");
const app = electron.app;
const ipcMain = electron.ipcMain;
const BrowserWindow = electron.BrowserWindow;
const nativeImage = electron.nativeImage;

var mainWindow = null;
var onlineStatusWindow = null;

app.disableHardwareAcceleration();

//初始化并准备创建主窗口
app.on("ready", function ()
{	
    mainWindow = new BrowserWindow({width:800,height:500,frame:false});
    mainWindow.loadURL("file://" + __dirname + "/index.html");//载入应用的inde.html	
	
    //mainWindow.openDevTools();	//打开浏览器调试工具

    var isInWin32 = (platform=="win32");
    if(isInWin32)
    {
    	var iconImage = nativeImage.createFromPath(__dirname + "/logo.png");
    	mainWindow.setIcon(iconImage);
    }
	
    mainWindow.on('closed', function(){
		console.log("mainWindow closed...");
        mainWindow = null            
    });
});

// Quit when all windows are closed.
app.on('window-all-closed', function() {
	app.quit();
});

//ipcMain对同步消息的处理
ipcMain.on('sync-message', function (event, arg){
	
});

//ipcMain对异步消息的处理
ipcMain.on("invoke-cpp-module", function(event, originStr) {
	
});
