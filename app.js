const electron = require('electron');
const { app, BrowserWindow, Menu,ipcMain } = electron;
const path = require('path');
const ejs = require('ejs');
const fs = require('fs')
const url = require('url');
const waitFor = (ms) => new Promise(r => setTimeout(r, ms));
const download = require('image-downloader')
const puppeteer = require('puppeteer');
const socket = require('socket.io-client')('https://kechuyengame.com/');
var html = '';
var metaDes = '';
var title = '';
var linkindex = 0;
var listDataLink = [];
var category = '';
var VietnameseSigns = [ "aAeEoOuUiIdDyY-",
	"áàạảãâấầậẩẫăắằặẳẵ",
	"ÁÀẠẢÃÂẤẦẬẨẪĂẮẰẶẲẴ",
	"éèẹẻẽêếềệểễ",
	"ÉÈẸẺẼÊẾỀỆỂỄ",
	"óòọỏõôốồộổỗơớờợởỡ",
	"ÓÒỌỎÕÔỐỒỘỔỖƠỚỜỢỞỠ",
	"úùụủũưứừựửữ",
	"ÚÙỤỦŨƯỨỪỰỬỮ",
	"íìịỉĩ",
	"ÍÌỊỈĨ",
	"đ",
	"Đ",
	"ýỳỵỷỹ",
	"ÝỲỴỶỸ",
	` ,"”'?!@#$%^&*()_/<>.|~:–.`,
];

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

var vietnameseStringToUrl = function(str) {
    for (var i = 1; i < VietnameseSigns.length; i++)
    {
        for (var j = 0; j < VietnameseSigns[i].length; j++)
            str = str.replaceAll(VietnameseSigns[i][j], VietnameseSigns[0][i - 1]);
	}
    return str.toLowerCase();
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

//==========================================================================


async function autoPage(url){
  const browser = await puppeteer.launch({headless: false});
  try {
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.goto(url);
    var listURL = await page.evaluate(()=>{
      var listLink=[]
      document.querySelectorAll('.post .inner .entry-aside > a').forEach(el=>{
          if(Array.from(el.nextElementSibling.classList).indexOf('review-score') === -1){ listLink.push(el.getAttribute('href'))}
      })
      return listLink
    })
    listDataLink = listURL.reverse()
    run()
    await browser.close()
  } catch (error) {
    await browser.close()
  }
}

async function createGetData(url){
  const browser = await puppeteer.launch({headless: false});
  try {
      const page = await browser.newPage();
      await page.setJavaScriptEnabled(false);
      await page.goto(url);

      const articles = await page.evaluate(() => {
        var arrIMG = []
        var imgIDX = 0;
        document.querySelectorAll('#primary .article-content-off > *').forEach(el=>{
            if(el.nodeName == 'UL' || el.nodeName == 'DIV'){
                if(el.firstElementChild){
                    if(el.firstElementChild.nodeName !='NOSCRIPT' ){
                        el.remove()
                    }
                }
            }
        })
        document.querySelectorAll('#primary .article-content-off > *').forEach((el,idx)=>{
            if(el.innerHTML.indexOf('noscript')!=-1){
                if(el.firstElementChild.firstElementChild.getAttribute('src') != null){
                  arrIMG.push(el.firstElementChild.firstElementChild.getAttribute('src'))
                }
                el.replaceWith('hereisIMG')
            }
            if(el.childElementCount > 0){
                Array.from(el.childNodes).forEach(el1=>{
                    if(el1.nodeName == 'A'){
                        el1.replaceWith(...el1.childNodes)
                    }
                })
            }
        })
        var obj = {
            arrIMG,
            html : document.querySelector('#primary .article-content-off').innerHTML,
            metaDes: document.querySelector('.post-excerpt.posts-small-info').innerText,
            title: document.querySelector('.entry-title').innerText,
        }
        return obj
      });
      html = articles.html.replace(/Mọt tui/g,'Kể chuyện game').replace(/Mọt game/g, 'Kể chuyện game').replace(/Mọt/g,'Kể chuyện game')
      metaDes = articles.metaDes;
      title = articles.title;
      main(articles.arrIMG).catch(e=>console.error(e))
      
      await browser.close();
  } catch (error) {
      console.log("Catch : " + error);
      await browser.close()
      linkindex++
      createGetData(listDataLink[linkindex])
  }
};

async function main(listLink) {
  fs.mkdirSync(path.join(__dirname,'kechuyengame/pc-console/'+ vietnameseStringToUrl(title)))
  var thumbnail;
  await asyncForEach(listLink,async (el,idx)=>{
    const options = {
        url: el,
        dest: path.join(__dirname,'kechuyengame/pc-console/'+ vietnameseStringToUrl(title))
    }
    const { filename, image } = await download.image(options)
    var file = filename.slice(filename.lastIndexOf('\\') + 1, filename.length)
    if(idx == 0){
      thumbnail = "https://images.kechuyengame.com/pc-console/"+vietnameseStringToUrl(title)+"/"+file
    }
    html = html.replace('hereisIMG', '<p><img src ="https://images.kechuyengame.com/pc-console/'+vietnameseStringToUrl(title)+'/'+file+'"/></p>');
  })
  var fnData = html.replace(/Mọt tui/g,'Kể chuyện game').replace(/Mọt game/g, 'Kể chuyện game').replace(/Mọt/g,'Kể chuyện game')
  var obj = {
    name:title,
    slug:vietnameseStringToUrl(title),
    metaDes:metaDes,
    content:fnData,
    parentID:category,
    thumbnail,
    display:true,
  }
  socket.emit('client-send-post-auto', obj);

}


let mainWin;
function createMainWin(){
    mainWin = new BrowserWindow({
        width: 1920, 
        height:1080, 
        backgroundColor:'#ccc', 
        title:'',
        webPreferences: {
            nodeIntegration: true,
            nativeWindowOpen: true,
        }
    });
    socket.emit('app-req-list-category')
    socket.on('server-res-list-category',function(data){
      ejs.renderFile(path.join(__dirname,'index.ejs'), {data}, function (err, str) {
        mainWin.loadURL(
            'data:text/html;charset=utf-8,' + encodeURI(str),
        );
      });
    })
    mainWin.webContents.openDevTools()
    mainWin.on('closed',()=>{
        mainWin = null;
    })
}



app.on('ready',createMainWin);

app.on('window-all-closed',()=>{
    if(process.platform != 'darwin'){
        app.quit()
    }
})
app.on('activate',()=>{
    if(mainWin == null){
        createMainWin()
    }
})



function run(){
  category = '5e809ecd5899281b2b7813cd';
  linkindex = 0;
  createGetData(listDataLink[linkindex])
}

var pageNum = 2

socket.on('add-post-auto-success',function(){
  if(linkindex < listDataLink.length-1){
    linkindex = linkindex + 1;
    createGetData(listDataLink[linkindex])
  }else{
    pageNum = pageNum - 1
    console.log(pageNum)
    autoPage('https://motgame.vn/pc-console' + pageNum)
  }
  mainWin.webContents.send('add-post-success')
})

autoPage('https://motgame.vn/pc-console2')