document.getElementsByClassName("addOption").forEach(btn=>{
  btn.onclick=(event)=>{
    const newOption=document.createElement("label")
    newOption.innerHTML="<input type='radio' name='vote'>"
    document.getElementById(`options${event.target.id.slice("addOption".length)}`).append(newOption)
  }
})