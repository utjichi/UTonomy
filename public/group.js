const newGroupBtn=document.getElementById("newGroup");
newGroupBtn.onclick=()=>{
  const isHidden=newGroupBtn.textContent=="+";
  newGroupBtn.textContent=isHidden?"x":"+";
  document.getElementById("newGroupConfig").style.display=isHidden?"block":"none"
};
