const electron = require('electron');
const { app, BrowserWindow, Menu,ipcMain } = electron;
const path = require('path');
const ejs = require('ejs');
const fs = require('fs')
const {OAuth2Client} = require('google-auth-library');
const http = require('http');
const url = require('url');
const open = require('open');
const destroyer = require('server-destroy');
const waitFor = (ms) => new Promise(r => setTimeout(r, ms));
const keys = require('./credentials.json');
const download = require('image-downloader')
const Photos = require('googlephotos');
const puppeteer = require('puppeteer');
const socket = require('socket.io-client')('https://kechuyengame.com/');
var oAuth2Client = '';
var html = '';
var metaDes = '';
var title = '';
var linkindex = 0;
var listDataLink = [];
var category = '';
var cookieFB = ''
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
	` ,"'?!@#$%^&*()_/<>.|~:–`,
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

async function loginFB(url){
  try {
      const browser = await puppeteer.launch({headless: false});
      const page = await browser.newPage();
      await page.setJavaScriptEnabled(false);
      await page.goto('https://m.facebook.com/');

      
      await page.type('#m_login_email', '0348373941');
      await page.type('#m_login_password', 'Phamgiavyvn123');
      await page.click('._54k8._52jh._56bs._56b_._28lf._56bw._56bu');
      await page.click('.bl.bn.bo.bp.br.bm');
      cookieFB = await page.cookies();
      await browser.close();
  } catch (error) {
    console.log("Catch : " + error);
  }
}

async function shareFB(content){
  try {
      const browser = await puppeteer.launch({headless: false});
      const page = await browser.newPage();
      await page.setCookie(...cookieFB);
      await page.setJavaScriptEnabled(false);
      await page.goto('https://m.facebook.com/kechuyengame/');

      
      await page.type('.dw.dx.dy.dz.ea.eb', content);
      await page.click('.z.ba.bb.ee.ct');
      await waitFor(500)
      await browser.close();
  } catch (error) {
    console.log("Catch : " + error);
  }
}

async function createGetList(url){
  try {
      const browser = await puppeteer.launch({headless: false});
      const page = await browser.newPage();
      await page.goto(url);

      const articles = await page.evaluate(() => {
        var div = document.createElement('div');
        div.setAttribute('id', 'lastoneid');
        document.querySelector('.B6Rt6d.zcLWac.eejsDc').append(div)
        document.getElementById("lastoneid").scrollIntoViewIfNeeded()
        var ar_title = [];
        document.querySelectorAll('[jsname="NwW5ce"] .p137Zd').forEach(el=>{
          var href = el.getAttribute('href')
          ar_title.push(href.replace('./share/',''))
        })
        return ar_title
      });
      await asyncForEach(articles, async (el,idx)=>{
        var lastRound = false;
        if(idx == 0){
          await creaateGetIMG(el,lastRound)
        }else if(idx == articles.length - 1){
          lastRound = true;
          await creaateGetIMG(el,lastRound)
        }else{
          await creaateGetIMG(el, lastRound)
        }
      })
      await browser.close();
  } catch (error) {
    console.log("Catch : " + error);
  }
}

async function creaateGetIMG(url, lastRound){
  try {
      const browser = await puppeteer.launch({headless: false});
      const page = await browser.newPage();
      await page.goto('https://photos.google.com/share/'+url);

      const articles = await page.evaluate(() => {
        var ar_title = document.querySelector('.SzDcob').getAttribute('src');
        return ar_title
      });
      html = html.replace('hereisIMG', '<p><img src ="'+articles+'"/></p>');
      if(lastRound){
        var fnData = html.replace(/Mọt tui/g,'Kể chuyện game').replace(/Mọt game/g, 'Kể chuyện game').replace(/Mọt/g,'Kể chuyện game')
        var obj = {
          name:title,
          slug:vietnameseStringToUrl(title),
          metaDes:metaDes,
          content:fnData,
          parentID:category,
          thumbnail:articles,
          display:true,
        }
        socket.emit('client-send-post-auto', obj);
        var fbContent = title + `
        `+metaDes + `
        `+'https://kechuyengame.com/bai-viet/'+vietnameseStringToUrl(title)
        // shareFB(fbContent)
      }
      
      await browser.close();
  } catch (error) {
    console.log("Catch : " + error);
  }
}

async function createGetData(url){
  try {
      const browser = await puppeteer.launch({headless: false});
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
  }
};
async function main(listLink) {
  console.log(listLink)
  if(oAuth2Client == ''){
    oAuth2Client = await getAuthenticatedClient();
    const photos = new Photos(oAuth2Client.credentials.access_token);
    const createAlbum = await photos.albums.create(title);
    mainWin.webContents.send('album-created',title)
    const option = {
      url:'https://photoslibrary.googleapis.com/v1/albums/'+createAlbum.id+':share',
      method: 'POST'
    }
    const res = await oAuth2Client.request(option);
    mainWin.webContents.send('album-shared',title)
    await asyncForEach(listLink,async (el,idx)=>{
      const options = {
          url: el,
          dest: './'
      }
      const { filename, image } = await download.image(options)
      mainWin.webContents.send('downloaded',idx)
      const response = await photos.mediaItems.upload(createAlbum.id, filename, './'+filename);
      mainWin.webContents.send('uploaded',idx)
      const fileDone = response.newMediaItemResults[0].mediaItem.filename;
      fs.unlink(path.join(__dirname, fileDone), function(err){mainWin.webContents.send('deleted',idx)})
    })
    mainWin.webContents.send('link-shared-album', res.data.shareInfo.shareableUrl)
    createGetList(res.data.shareInfo.shareableUrl,listLink.length)
  }else{
    const photos = new Photos(oAuth2Client.credentials.access_token);
    const createAlbum = await photos.albums.create(title);
    mainWin.webContents.send('album-created',title)
    const option = {
      url:'https://photoslibrary.googleapis.com/v1/albums/'+createAlbum.id+':share',
      method: 'POST'
    }
    const res = await oAuth2Client.request(option);
    mainWin.webContents.send('album-shared',title)
    await asyncForEach(listLink,async (el,idx)=>{
      const options = {
          url: el,
          dest: './'
      }
      const { filename, image } = await download.image(options)
      mainWin.webContents.send('downloaded',idx)
      const response = await photos.mediaItems.upload(createAlbum.id, filename, './'+filename);
      mainWin.webContents.send('uploaded',idx)
      const fileDone = response.newMediaItemResults[0].mediaItem.filename;
      fs.unlink(path.join(__dirname, fileDone), function(err){mainWin.webContents.send('deleted',idx)})
    })
    mainWin.webContents.send('link-shared-album', res.data.shareInfo.shareableUrl)
    createGetList(res.data.shareInfo.shareableUrl,listLink.length)
  }
}


function getAuthenticatedClient() {
  return new Promise((resolve, reject) => {
    const oAuth2Client = new OAuth2Client(
      keys.web.client_id,
      keys.web.client_secret,
      keys.web.redirect_uris[0]
    );
 
    const authorizeUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: 'https://www.googleapis.com/auth/photoslibrary.sharing',
    });
    const server = http
      .createServer(async (req, res) => {
        try {
          if (req.url.indexOf('/oauth2callback') > -1) {
            const qs = new url.URL(req.url, 'http://localhost:3000')
              .searchParams;
            const code = qs.get('code');
            res.end('Authentication successful! Please return to the console.');
            server.destroy();
            const r = await oAuth2Client.getToken(code);
            oAuth2Client.setCredentials(r.tokens);            // console.log(createAlbum)
            resolve(oAuth2Client);
          }
        } catch (e) {
          reject(e);
        }
      })
      .listen(3000, () => {
        open(authorizeUrl, {wait: false}).then(cp => cp.unref());
      });
    destroyer(server);
  });
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
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu)
    mainWin.webContents.openDevTools()
    mainWin.on('closed',()=>{
        mainWin = null;
    })
}

// socket.on('server-res-list-cosplay',async function(data){
  
//   await asyncForEach(data, async (el,idx)=>{
//     var fbContent = el.name + `
//     `+el.metaDes+`
//     `+'https://kechuyengame.com/bai-viet/'+el.slug;
//     await shareFB(fbContent)
//   })
// })

const mainMenuTemplate = [
  {
      label: 'Login Facebook',
      click(){loginFB()}
  },
  {
    label: 'share Facebook',
    click(){socket.emit('client-get-list-cosplay')}
},
];

ipcMain.on('user-send-data',async (e,data)=>{
  category = data.category;
  listDataLink = data.listLink;
  linkindex = 0;
  createGetData(listDataLink[linkindex])
})


ipcMain.on('user-send-get-data-by-link',(e,data)=>{
  
})

socket.on('add-post-auto-success',function(){
  if(linkindex < listDataLink.length-1){
    linkindex = linkindex + 1;
    createGetData(listDataLink[linkindex])
  }
  mainWin.webContents.send('add-post-success')
})

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