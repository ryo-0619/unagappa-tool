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
// doPost 内で e.parameter で受け取る系（addMember / deleteMember / deletePayment / deleteRefund / registerItem）
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
// doPost 内で JSON.parse(e.postData.contents) している系（registerPayment / registerRefund / executeSettlement）
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
  return await gasGet("getMembers"); // { members: [...] }
}

// メンバー追加（POST FormData: addMember）
async function apiAddMember(name) {
  return await gasPostForm("addMember", { name }); // { status: 'ok' }
}

// メンバー削除（POST FormData: deleteMember）
async function apiDeleteMember(id) {
  return await gasPostForm("deleteMember", { id }); // { status: 'ok' }
}


// ===== 支払い登録・削除・履歴 =====

// 支払い登録（POST JSON: registerPayment）
async function apiRegisterPayment(data) {
  // data は GAS の registerPayment が期待する形：
  // {
  //   date: "2024-01-01",
  //   title: "飲み会",
  //   payers: [{ memberId: "M1", amount: 3000 }, ...],
  //   receivers: [{ memberId: "M2", amount: 3000 }, ...]
  // }
  return await gasPostJson("registerPayment", data); // { status: 'ok' }
}

// 支払い削除（POST FormData: deletePayment）
async function apiDeletePayment(id) {
  return await gasPostForm("deletePayment", { id }); // { status: 'ok' }
}

// 履歴取得（GET: getHistories）
async function apiGetHistories() {
  return await gasGet("getHistories"); // { payments: [...], refunds: [...] }
}


// ===== 返金登録・削除 =====

// 返金登録（POST JSON: registerRefund）
async function apiRegisterRefund(data) {
  // data は GAS の registerRefund が期待する形：
  // {
  //   from: "M1",
  //   to: "M2",
  //   amount: 1000,
  //   memo: "精算"
  // }
  return await gasPostJson("registerRefund", data); // { status: 'ok' }
}

// 返金削除（POST FormData: deleteRefund）
async function apiDeleteRefund(id) {
  return await gasPostForm("deleteRefund", { id }); // { status: 'ok' }
}


// ===== 残高表示 =====

// 残高取得（GET: getBalances）
async function apiGetBalances() {
  return await gasGet("getBalances"); // { balances: [...] }
}


// ===== 精算案表示・精算実行 =====

// 精算案取得（GET: getSettlement）
async function apiGetSettlement() {
  return await gasGet("getSettlement"); // { suggestions: [...] }
}

// 精算実行（POST JSON: executeSettlement）
async function apiExecuteSettlement(ids) {
  // ids は ["M1_M2", "M3_M4", ...] のような配列
  return await gasPostJson("executeSettlement", { ids }); // { status: 'ok' }
}


// ===== 棚卸（画像アップロード・一覧） =====

// 棚卸登録（画像付き）
// formElement は <form> 要素、
// その中に <input name="name">, <input name="qty">, <input type="file" name="photo"> などがある想定
async function apiRegisterItem(formElement) {
  const formData = new FormData(formElement);
  formData.append("action", "registerItem");

  const res = await fetch(GAS_URL, {
    method: "POST",
    mode: "cors",
    body: formData
  });

  return await res.json(); // { status: 'ok', photoUrl: "..." }
}

// 棚卸一覧取得（GET: getItems）
async function apiGetItems() {
  return await gasGet("getItems"); // { items: [...] }
}
