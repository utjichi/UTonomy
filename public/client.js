const postForm=document.getElementById("post");
const voteType=postForm.voteType;
voteType.onchange=()=>{
  postForm.voter.style.display=voteType.value=="none"?"none":"inline";
}