const newGroupBtn=document.getElementById("newGroup");
const ngbInit=newGroupBtn.textContent
newGroupBtn.onclick=()=>{
  const isHidden=newGroupBtn.textContent==ngbInit;
  newGroupBtn.textContent=isHidden?"キャンセル":ngbInit;
  document.getElementById("newGroupConfig").style.display=isHidden?"block":"none"
};
