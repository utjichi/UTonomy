const postForm = document.getElementById("post");
const voteType = postForm.voteType;
voteType.onchange = () => {
  postForm.voter.style.display = voteType.value == "none" ? "none" : "inline";
  const selectElement = document.getElementById("voteType");
  const inputContainer = document.getElementById("inputContainer");
  const selectedOption = selectElement.options[selectElement.selectedIndex];

  // class="customOptions"が選ばれた場合にボックスを表示
  if (selectedOption.classList.contains("customOptions")) {
    inputContainer.style.display = "block";
  } else {
    inputContainer.style.display = "none";
    document.getElementById("optionList").innerHTML = ""; // リストをクリア
  }
};

document.getElementById("addOption").onclick = () => {
  const inputField = document.getElementById("customOption");
  const optionList = document.getElementById("optionList");

  if (inputField.value.trim() !== "") {
    const newOption = document.createElement("li");
    newOption.textContent = inputField.value;
    optionList.appendChild(newOption);
    inputField.value = ""; // 入力フィールドをクリア
  }
};
