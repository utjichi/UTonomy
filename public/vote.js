document.getElementsByClassName("addOption").forEach(btn=>{
  btn.onclick=(event)=>{
    const newOption=document.createElement()
    document.getElementById(`options${event.target.id.slice("addOption".length)}`).append()
  }
})