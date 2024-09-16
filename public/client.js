const showInputBox = () => {
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
const postForm = document.getElementById("post");
const voteType = postForm.voteType;
voteType.onchange = () => {
  postForm.voter.style.display = voteType.value == "none" ? "none" : "inline";
  showInputBox();
};

const addOption = () => {
  const inputField = document.getElementById("customOption");
  const optionList = document.getElementById("optionList");

  if (inputField.value.trim() !== "") {
    const newOption = document.createElement("li");
    newOption.className = "draggable";
    newOption.setAttribute("draggable", "true");
    newOption.innerHTML = `
            <span>${inputField.value}</span>
            <button onclick="editOption(this)">編集</button>
            <button onclick="removeOption(this)">削除</button>
        `;
    optionList.appendChild(newOption);
    inputField.value = ""; // 入力フィールドをクリア

    // ドラッグイベントのリスナーを追加
    newOption.ondragstart = dragStart;
    newOption.ondragover = dragOver;
    newOption.ondrop = drop;
  }
};

const editOption = (button) => {
  const listItem = button.parentElement;
  const span = listItem.querySelector("span");
  const newValue = prompt("新しい選択肢を入力:", span.textContent);
  if (newValue !== null && newValue.trim() !== "") {
    span.textContent = newValue;
  }
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
    const draggingHTML = draggingElement.outerHTML;
    draggingElement.outerHTML = dropzone.outerHTML;
    dropzone.outerHTML = draggingHTML;

    // ドラッグイベントのリスナーを再追加
    const newDraggingElement = document.querySelector(".dragging");
    newDraggingElement.ondragstart = dragStart;
    newDraggingElement.ondragover = dragOver;
    newDraggingElement.ondrop = drop;
  }

  draggingElement.classList.remove("dragging");
};

// 追加ボタンのonclickイベントを設定
document.getElementById("addOptionButton").onclick = addOption;
