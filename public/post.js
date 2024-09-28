const postForm = document.getElementById("post");
const voteType = postForm.voteType;
// ログイン済の場合
if (voteType) {
  voteType.onchange = () => {
    postForm.voter.style.display = voteType.value == "none" ? "none" : "inline";
    const selectElement = document.getElementById("voteType");
    const inputContainer = document.getElementById("inputContainer");
    const selectedOption = selectElement.options[selectElement.selectedIndex];

    if (selectedOption.classList.contains("customOptions")) {
      inputContainer.style.display = "block";
    } else {
      inputContainer.style.display = "none";
      document.getElementById("optionList").innerHTML = ""; // リストをクリア
    }
  };

  // 追加ボタンのonclickイベントを設定
  document.getElementById("addOptionButton").onclick = addOption;
}

const addOption = () => {
  const optionList = document.getElementById("optionList");

  // 新しい選択肢を作成
  const newOption = document.createElement("li");
  newOption.className = "draggable";
  newOption.setAttribute("draggable", "true");

  // 空の入力フィールドを作成
  const optionInput = document.createElement("input");
  optionInput.name = "option";
  optionInput.value = ""; // 空欄の選択肢
  optionInput.className = "option-input";

  // 削除ボタンを作成
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-button";
  deleteButton.textContent = "削除";
  deleteButton.onclick = () => removeOption(deleteButton);

  newOption.appendChild(optionInput);
  newOption.appendChild(deleteButton);
  optionList.appendChild(newOption);

  // ドラッグイベントリスナーを設定
  newOption.ondragstart = dragStart;
  newOption.ondragover = dragOver;
  newOption.ondrop = drop;
};

const removeOption = (button) => {
  const listItem = button.parentElement;
  listItem.remove();
};

const dragStart = (event) => {
  event.dataTransfer.setData("text/plain", event.target.innerHTML);
  event.target.classList.add("dragging");
};

const dragOver = (event) => {
  event.preventDefault();
};

const drop = (event) => {
  event.preventDefault();
  const draggingElement = document.querySelector(".dragging");
  const dropzone = event.target.closest("li");

  if (dropzone && draggingElement !== dropzone) {
    // ドラッグしている要素の入力値を取得
    const draggingInputValue = draggingElement.querySelector("input").value;
    const dropzoneInputValue = dropzone.querySelector("input").value;

    // ドラッグしている要素の入力値をドロップ先に設定
    draggingElement.querySelector("input").value = dropzoneInputValue;
    dropzone.querySelector("input").value = draggingInputValue;

    // HTMLを入れ替えるのではなく、値を入れ替える
    // これにより、両方の要素が空欄になる問題を回避
  }

  draggingElement.classList.remove("dragging");
};
