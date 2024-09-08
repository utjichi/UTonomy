const newGroupBtn=document.getElementById("newGroup");
newGroupBtn.onclick=()=>{
  const isHidden=newGroupBtn.textContent=="+";
  newGroupBtn.textContent=isHidden?"x":"+";
  document.getElementById("newGroupConfig").style.display=isHidden?"block":"none"
};

const postForm=document.getElementById("post");
const voteType=postForm.voteType;
voteType.onchange=()=>{
  postForm.voter.style.display=voteType.value=="none"?"none":"inline";
}