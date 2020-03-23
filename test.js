function getData(){
    var arrIMG = []
    document.querySelectorAll('#primary .article-content-off > *').forEach(el=>{
        if(el.nodeName == 'UL' || el.nodeName == 'DIV'){
            if(el.firstElementChild){
                if(el.firstElementChild.nodeName !='NOSCRIPT' ){
                    el.remove()
                }
            }
        }
    })
    document.querySelectorAll('#primary .article-content-off > *').forEach(el=>{
        if(el.innerHTML.indexOf('noscript')!=-1){

            arrIMG.push(el.firstElementChild.firstElementChild.getAttribute('src'))
            el.remove()
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
        html : document.querySelector('#primary .article-content-off').innerHTML
    }
}