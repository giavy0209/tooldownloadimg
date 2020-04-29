if(document.querySelector('.klw-new-content iframe')){
    document.querySelector('.klw-new-content iframe').remove()
}

if(document.querySelector('.link-content-footer')){
    document.querySelector('.link-content-footer').remove()
}

if(document.getElementById('ContentPlaceHolder1_ContentPlaceHolder1_ctrNewsDetail_lstRelation')){
    document.getElementById('ContentPlaceHolder1_ContentPlaceHolder1_ctrNewsDetail_lstRelation').remove()
}

document.querySelectorAll('.VCSortableInPreviewMode a').forEach(el=>{
    el.remove()
})

if(document.querySelector('.VCSortableInPreviewMode')){
   
}
if(document.querySelector('.knc-menu-nav')){
    document.querySelector('.knc-menu-nav').remove()
}

var listIMG = []

document.querySelectorAll('.VCSortableInPreviewMode img').forEach(el=>{
    el.removeAttribute('data-original')
    listIMG.push(el.getAttribute('src'))
    el.setAttribute('src','hereisIMG')
})

var title = document.querySelector('.kbwc-title').innerText
var des = document.querySelector('.knc-sapo').innerText
var content = document.querySelector('.klw-new-content').innerHTML

