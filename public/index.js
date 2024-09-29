const viewOpt=document.getElementById("viewOpt")
viewOpt.show.onchange=()=>viewOpt.submit()

document.getElementByClassName("post").forEach((postLi)=>{
  postLi.onclick=()=>{
    location.href="/comments/"+postLi.id
  }
})