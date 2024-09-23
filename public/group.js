const newGroupBtn=document.getElementById("newGroup");
newGroupBtn.onclick=()=>{
  const isHidden=newGroupBtn.textContent=="新規グループ";
  newGroupBtn.textContent=isHidden?"キャンセル":"新規グループ";
  document.getElementById("newGroupConfig").style.display=isHidden?"block":"none"
};
