const viewOpt=document.getElementById("viewOpt")
viewOpt.show.onchange=()=>viewOpt.submit()

for(const postLi of document.getElementsByClassName("post")){
  postLi.onclick=()=>{
    location.href="/comments/"+postLi.id
  }
}