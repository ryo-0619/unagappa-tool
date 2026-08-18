// ======== GAS の URL ========
const GAS_URL = "https://script.google.com/macros/s/AKfycb4XMvkk6gTDwfPVmSnugmpOtOxkXkEH8gqeZE5hnv5q7vJ3VjzbekU58tJpoz8Y7Hf/exec";


// ======== 共通：GET ========
async function gasGet(action) {
  const res = await fetch(`${GAS_URL}?action=${encodeURIComponent(action)}`, {
    method: "GET",
    mode: "cors"
  });
  return await res.json();
}


// ======== 共通：POST（FormData 用） ========
async function gasPostForm(action, payload = {}) {
  const form = new FormData();
  form.append("action", action);

  Object.keys(payload).forEach(key => {
    if (payload[key] !== undefined && payload[key] !== null) {
      form.append(key, payload[key]);
    }
  });

  const res = await fetch(GAS_URL, {
    method: "POST",
    mode: "cors",
    body: form
  });

  return await res.json();
}


// ======== 共通：POST（JSON 用） ========
async function gasPostJson(action, payload = {}) {
  const res = await fetch(GAS_URL, {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload })
  });

  return await res.json();
}


// ==============================
// ここから API ごとのラッパー
// ==============================


// ===== メンバー追加・削除・一覧 =====

// メンバー一覧取得（GET: getMembers）
async function apiGetMembers() {
  return await gasGet("getMembers");
}

// メンバー追加（POST FormData: addMember）
async function apiAddMember(name) {
  return await gasPostForm("addMember", { name });
}

// メンバー削除（POST FormData: deleteMember）
async function apiDeleteMember(id) {
  return await gasPostForm("deleteMember", { id });
}


// ===== 支払い登録・削除・履歴 =====

// 支払い登録（POST JSON: addPayment）
async function apiRegisterPayment(data) {
  return await gasPostJson("addPayment", data);
}

// 支払い削除（POST FormData: deletePayment）
async function apiDeletePayment(id) {
  return await gasPostForm("deletePayment", { id });
}

// 履歴取得（GET: getHistories）
async function apiGetHistories() {
  return await gasGet("getHistories");
}


// ===== 返金登録・削除 =====

// 返金登録（POST JSON: addRefund）
async function apiRegisterRefund(data) {
  return await gasPostJson("addRefund", data);
}

// 返金削除（POST FormData: deleteRefund）
async function apiDeleteRefund(id) {
  return await gasPostForm("deleteRefund", { id });
}


// ===== 残高表示 =====

// 残高取得（GET: getBalances）
async function apiGetBalances() {
  return await gasGet("getBalances");
}


// ===== 精算案表示・精算実行 =====

// 精算案取得（GET: getSettlement）
async function apiGetSettlement() {
  return await gasGet("getSettlement");
}

// 精算実行（POST JSON: executeSettlement）
async function apiExecuteSettlement(ids) {
  return await gasPostJson("executeSettlement", { ids });
}


// ===== 棚卸（画像アップロード・一覧） =====

// 棚卸登録（画像付き）
async function apiRegisterItem(formElement) {
  const formData = new FormData(formElement);
  formData.append("action", "registerItem");

  const res = await fetch(GAS_URL, {
    method: "POST",
    mode: "cors",
    body: formData
  });

  return await res.json();
}

// 棚卸一覧取得（GET: getItems）
async function apiGetItems() {
  return await gasGet("getItems");
}
