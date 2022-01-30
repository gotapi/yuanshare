const electron = require("electron")
const axios =require( "axios")
const qs =  require( "qs")
const ipc = require('electron').ipcRenderer

const path = require("path");
const storage = require('./storage');
const os = require("os")
storage.setStoragePath(path.join(os.homedir(),"/.404up.json"))
let token  = storage.getItem("token")
// contextBridge.exposeInMainWorld("token",token);
// contextBridge.exposeInMainWorld("setToken",(token)=>{
//     ipc.send("update-token",[token]);
// });
// contextBridge.exposeInMainWorld("ipc",ipc);

axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
axios.defaults.headers.post['Authorization'] = token;

window.addEventListener('DOMContentLoaded', () => {
    window.token = token;
    const buttonCopied = document.getElementById('copied');
    buttonCopied.addEventListener("click",()=>{
        ipc.send('open-file-dialog-for-file')
    });
    $("#bottom a").click(function (e) {
        e.preventDefault();
        electron.shell.openExternal('https://404.ms/');
    });
    window.lasturl = "";
    // prevent default behavior from changing page on dropped file
    window.ondragover = function (e) {
        e.preventDefault();
        return false
    };
    window.ondragend = function (e) {
        e.preventDefault();
        return false
    };
    window.ondrop = function (e) {
        e.preventDefault();
        return false
    };

    var holder = document.getElementById('holder');
    holder.ondragover = function () {
        $(this).addClass('hover');
        return false;
    };
    holder.ondragend = function () {
        $(this).removeClass("hover");
        return false;
    };
    $("#url").click(function () {
        if (window.lasturl !== "") {
            require('electron').remote.shell.openExternal(window.lasturl);
        }
    });

    holder.ondrop = function (e) {
        e.preventDefault();

        for (var i = 0; i < e.dataTransfer.files.length; ++i) {
            console.log(e.dataTransfer.files[i].path);

            upload(e.dataTransfer.files[i].path);
            //console.log(e.dataTransfer.files[i].path);
        }
        return false;
    };

    window.old_tip = $(".copied").html();
    $('#himg .text').pastableTextarea();
    $("#himg .text").on("change",function(){
        $(this).html("如果您截了屏,可以在这里点击一下，再Ctrl-V就可以粘贴图片内容,自动上传");
    });
    $("#himg .text").on("pasteImage", function (ev, data) {
        console.log(data);
        var blobUrl = URL.createObjectURL(data.blob);
        var html = $('<div class="result">image: ' + data.width + ' x ' + Math.max(100,data.height) + '<img src="' + data.dataURL +'" ><a href="' + blobUrl + '">' + blobUrl + '</div>').html();
        $("#himg .placeholder").html(html);

        setTimeout(function(){
            $("#himg .placeholder").html("");
        },2000);

        axios.post("http://zshare.local.404.ms/api/img", qs.stringify({d: data.dataURL})).then( function (res) {
            console.log(res);
            console.log(typeof  res);
            console.dir(res);
            if(res.data.code === 403 ){
                try {
                    ipc.send("need-login",[]);
                }catch (e) {
                    console.log("ipc send msg failed");
                }
            }
            if (res.data.code === 200) {
                window.lasturl = res.data.data;
                $("#url").val(res.data.data).show();
                electron.clipboard.writeText(res.data.data);
                let myNotification = new Notification('分享成功', {
                    body: '分享网址已经更新到剪贴板'
                });

                $(".copied").html("分享网址已经复制到剪贴板").show().fadeOut(1500, function () {
                    $(".copied").show().html(window.old_tip);
                });
            }
        }).catch((e)=>{
            console.log(e);
            console.log("got error!");
        });
    });



});
ipc.on('selected-file', function (event, path) {
    console.log('Full path: ', path);
    if(!path.canceled){
       for(let i in path.filePaths){
           console.log(path.filePaths[i]);
           upload(path.filePaths[i]);
       }
    }
});
function upload(file) {
    console.log("try to upload file:" + file);
    nodeup_Upload(
        "http://zshare.local.404.ms/api/upload", file, {
            "Authorization":token
        }, function (res) {
            console.log(res.body);
            $("#choosefile").val("");
            $("#holder").removeClass("hover");
            let jsonobj;
            try {
                jsonobj = JSON.parse(res.body);
                console.log(jsonobj);
            } catch (e) {
                console.log(e);
                alert("上传可耻地失败鸟....");
                return;
            }
            let url = jsonobj.data;
            window.lasturl = url;
            if (jsonobj.code === 200) {

                $(".copied").html("分享网址已经复制到剪贴板").show().fadeOut(1500, function () {
                    $(".copied").show().html(window.old_tip);
                });
                let myNotification = new Notification('分享成功', {
                    body: '分享网址已经更新到剪贴板'
                });
                $("#url").val(url).show();
                console.log("url:"+url);
                electron.clipboard.writeText(url);

            }
            if (jsonobj.code === 403){
                ipc.send("need-login");
            }
        }, function (e) {
            console.log(e);
        }
    );
}
