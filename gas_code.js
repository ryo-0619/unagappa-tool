// ======== GAS の URL ========
const GAS_URL = "https://script.google.com/macros/s/AKfycb4XMvkk6gTDwfPVmSnugmpOtOxkXkEH8gqeZE5hnv5q7vJ3VjzbekU58tJpoz8Y7Hf/exec";


// ======== GET 共通関数 ========
async function gasGet(action) {
  const res = await fetch(`${GAS_URL}?action=${action}`, {
    method: "GET",
    mode: "cors"
  });
  return await res.json();
}


// ======== POST 共通関数 ========
async function gasPost(action, payload = {}) {
  const res = await fetch(GAS_URL, {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload })
  });
  return await res.json();
}


// ======== メンバー関連 ========

// メンバー一覧取得
async function getMembers() {
  return await gasGet("getMembers");
}

// メンバー追加
async function addMember(name) {
  return await gasPost("addMember", { name });
}

// メンバー削除
async function deleteMember(id) {
  return await gasPost("deleteMember", { id });
}


// ======== 支払い関連 ========

// 支払い登録
async function registerPayment(data) {
  return await gasPost("registerPayment", data);
}

// 支払い削除
async function deletePayment(id) {
  return await gasPost("deletePayment", { id });
}

// 履歴取得
async function getHistories() {
  return await gasGet("getHistories");
}


// ======== 返金関連 ========

// 返金登録
async function registerRefund(data) {
  return await gasPost("registerRefund", data);
}

// 返金削除
async function deleteRefund(id) {
  return await gasPost("deleteRefund", { id });
}


// ======== 残高関連 ========

// 残高取得
async function getBalances() {
  return await gasGet("getBalances");
}


// ======== 精算関連 ========

// 精算案取得
async function getSettlement() {
  return await gasGet("getSettlement");
}

// 精算実行
async function executeSettlement(ids) {
  return await gasPost("executeSettlement", { ids });
}


// ======== 棚卸（画像アップロード） ========

// 画像アップロード付き棚卸登録
async function registerItem(formData) {
  formData.append("action", "registerItem");

  const res = await fetch(GAS_URL, {
    method: "POST",
    mode: "cors",
    body: formData
  });

  return await res.json();
}

// 棚卸一覧取得
async function getItems() {
  return await gasGet("getItems");
}
