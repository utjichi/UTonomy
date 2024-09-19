for(const btn of document.getElementsByClassName("addOption")){
  btn.onclick=(event)=>{
    const postId=event.target.id.slice("addOption".length)
    const options=document.getElementById(`options${postId}`)
    const newOption=document.createElement("label")
    const ui=document.createElement("input")
    ui.type="radio"
    ui.name="vote"
    newOption.append(ui)
    const option=document.createElement("input")
    option.oninput=()=>{
      ui.value=option.value
    }
    newOption.append(option)
    options.append(newOption)
  }
})