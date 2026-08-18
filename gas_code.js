const SPREADSHEET_ID = '14qsCV-m8-eflETSm_B9koGk0Vl3FvY0UMvjjCYU6pwg';
const DRIVE_FOLDER_ID = 'my-drive?hl=ja';

// JSON返却用
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// GET（データ取得）
function doGet(e) {
  const action = e.parameter.action;

  if (action === 'getMembers') {
    return json(getMembers());
  }

  if (action === 'getItems') {
    return json(getItems());
  }

  if (action === 'getHistories') {
    return json(getHistories());
  }

  if (action === 'getBalances') {
    return json(getBalances());
  }

  if (action === 'getSettlement') {
    return json(getSettlement());
  }

  return json({ error: 'unknown action' });
}

// POST（データ登録）
function doPost(e) {
  const action = e.parameter.action;

  if (action === 'addMember') {
    addMember(e.parameter.name);
    return json({ status: 'ok' });
  }

  if (action === 'deleteMember') {
    const id = e.parameter.id;
    deleteMember(id);
    return json({ status: 'ok' });
  }

  if (action === 'registerPayment') {
    const payload = JSON.parse(e.postData.contents);
    registerPayment(payload);
    return json({ status: 'ok' });
  }

  if (action === 'registerRefund') {
    const payload = JSON.parse(e.postData.contents);
    registerRefund(payload);
    return json({ status: 'ok' });
  }

  if (action === 'deletePayment') {
    const id = e.parameter.id;
    deletePayment(id);
    return json({ status: 'ok' });
  }

  if (action === 'deleteRefund') {
    const id = e.parameter.id;
    deleteRefund(id);
    return json({ status: 'ok' });
  }

  if (action === 'executeSettlement') {
    const payload = JSON.parse(e.postData.contents);
    executeSettlement(payload.ids);
    return json({ status: 'ok' });
  }

  if (action === 'registerItem') {
    return json(registerItem(e));
  }

  return json({ error: 'unknown action' });
}

/* ===== メンバー ===== */
function getMembers() {
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Members');
  const values = sh.getDataRange().getValues().slice(1);
  const members = values
    .filter(r => r[0] && r[1])
    .map(r => ({ id: r[0], name: r[1] }));
  return { members };
}

function addMember(name) {
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Members');
  const id = 'M' + Date.now();
  sh.appendRow([id, name]);
}

function deleteMember(id) {
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Members');
  const values = sh.getDataRange().getValues();
  
  for (let i = values.length - 1; i >= 1; i--) {
    if (values[i][0] === id) {
      sh.deleteRow(i + 1);
      break;
    }
  }
}

/* ===== 支払い記録 ===== */
function registerPayment(data) {
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Payments');
  const id = 'P' + Date.now();
  
  const payerIds = data.payers.map(p => p.memberId).join(',');
  const payerAmounts = data.payers.map(p => p.amount).join(',');
  const debtorIds = data.receivers.map(r => r.memberId).join(',');
  const debtorAmounts = data.receivers.map(r => r.amount).join(',');
  
  sh.appendRow([
    id,
    data.date,
    data.title,
    payerIds,
    payerAmounts,
    debtorIds,
    debtorAmounts
  ]);
  
  // Balances更新
  updateBalances();
}

function deletePayment(id) {
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Payments');
  const values = sh.getDataRange().getValues();
  
  for (let i = values.length - 1; i >= 1; i--) {
    if (values[i][0] === id) {
      sh.deleteRow(i + 1);
      break;
    }
  }
  
  updateBalances();
}

function getHistories() {
  const ssPayments = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Payments');
  const ssRefunds = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Refunds');
  
  const paymentValues = ssPayments.getDataRange().getValues().slice(1);
  const refundValues = ssRefunds.getDataRange().getValues().slice(1);
  
  const members = getMembers().members;
  const memberMap = {};
  members.forEach(m => memberMap[m.id] = m.name);
  
  const payments = paymentValues
    .filter(r => r[0])
    .map(r => ({
      id: r[0],
      date: r[1],
      title: r[2],
      summary: `立替: ${r[3]}, 債務: ${r[5]}`
    }));
  
  const refunds = refundValues
    .filter(r => r[0])
    .map(r => ({
      id: r[0],
      date: r[1],
      summary: `${memberMap[r[2]] || r[2]} → ${memberMap[r[4]] || r[4]}: ${r[6]}`
    }));
  
  return { payments, refunds };
}

/* ===== 返金記録 ===== */
function registerRefund(data) {
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Refunds');
  const id = 'R' + Date.now();
  
  // メンバー情報取得
  const members = getMembers().members;
  const payerName = members.find(m => m.id === data.from)?.name || '';
  const receiverName = members.find(m => m.id === data.to)?.name || '';
  
  sh.appendRow([
    id,
    new Date().toISOString().split('T')[0],
    data.from,
    payerName,
    data.to,
    receiverName,
    data.amount,
    data.memo
  ]);
  
  // Balances更新
  updateBalances();
}

function deleteRefund(id) {
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Refunds');
  const values = sh.getDataRange().getValues();
  
  for (let i = values.length - 1; i >= 1; i--) {
    if (values[i][0] === id) {
      sh.deleteRow(i + 1);
      break;
    }
  }
  
  updateBalances();
}

/* ===== 残高管理 ===== */
function updateBalances() {
  const members = getMembers().members;
  const sshPayments = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Payments');
  const sshRefunds = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Refunds');
  const sshBalances = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Balances');
  
  const balances = {};
  members.forEach(m => balances[m.id] = { name: m.name, balance: 0 });
  
  // 支払い記録から残高計算
  const paymentValues = sshPayments.getDataRange().getValues().slice(1);
  paymentValues.forEach(r => {
    if (!r[0]) return;
    
    const payerIds = String(r[3]).split(',').filter(x => x);
    const payerAmounts = String(r[4]).split(',').filter(x => x).map(Number);
    const debtorIds = String(r[5]).split(',').filter(x => x);
    const debtorAmounts = String(r[6]).split(',').filter(x => x).map(Number);
    
    payerIds.forEach((id, i) => {
      if (balances[id]) {
        balances[id].balance += payerAmounts[i] || 0;
      }
    });
    
    debtorIds.forEach((id, i) => {
      if (balances[id]) {
        balances[id].balance -= debtorAmounts[i] || 0;
      }
    });
  });
  
  // 返金記録から残高計算
  const refundValues = sshRefunds.getDataRange().getValues().slice(1);
  refundValues.forEach(r => {
    if (!r[0]) return;
    
    const payerId = r[2];
    const receiverId = r[4];
    const amount = Number(r[6]) || 0;
    
    if (balances[payerId]) {
      balances[payerId].balance -= amount;
    }
    if (balances[receiverId]) {
      balances[receiverId].balance += amount;
    }
  });
  
  // Balancesシート更新
  sshBalances.clearContents();
  sshBalances.appendRow(['メンバーID', 'メンバー名', '残高']);
  
  Object.keys(balances).forEach(id => {
    sshBalances.appendRow([
      id,
      balances[id].name,
      balances[id].balance
    ]);
  });
}

function getBalances() {
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Balances');
  const values = sh.getDataRange().getValues().slice(1);
  
  const balances = values
    .filter(r => r[0] && r[1])
    .map(r => ({
      id: r[0],
      name: r[1],
      amount: Number(r[2]) || 0
    }));
  
  return { balances };
}

/* ===== 精算提案 ===== */
function getSettlement() {
  const balances = getBalances().balances;
  const suggestions = [];
  
  // 単純なマッチング：正の残高を持つ人が負の残高を持つ人に払う
  const creditors = balances.filter(b => b.amount > 0);
  const debtors = balances.filter(b => b.amount < 0);
  
  creditors.forEach(creditor => {
    debtors.forEach(debtor => {
      const amount = Math.min(creditor.amount, Math.abs(debtor.amount));
      if (amount > 0) {
        suggestions.push({
          id: creditor.id + '_' + debtor.id,
          fromId: debtor.id,
          fromName: debtor.name,
          toId: creditor.id,
          toName: creditor.name,
          amount: amount
        });
      }
    });
  });
  
  return { suggestions };
}

function executeSettlement(ids) {
  const sshRefunds = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Refunds');
  const suggestions = getSettlement().suggestions;
  
  ids.forEach(id => {
    const suggestion = suggestions.find(s => s.id === id);
    if (suggestion) {
      const refundId = 'R' + Date.now();
      sshRefunds.appendRow([
        refundId,
        new Date().toISOString().split('T')[0],
        suggestion.fromId,
        suggestion.fromName,
        suggestion.toId,
        suggestion.toName,
        suggestion.amount,
        '精算'
      ]);
    }
  });
  
  updateBalances();
}

/* ===== 棚卸（画像アップロード） ===== */
function registerItem(e) {
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Inventory');

  const name = e.parameter.name;
  const qty = e.parameter.qty;
  const buyDate = e.parameter.buyDate;
  const expireDate = e.parameter.expireDate;
  const memo = e.parameter.memo;

  let photoUrl = '';

  if (e.files && e.files.photo) {
    const blob = e.files.photo;
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const file = folder.createFile(blob);
    photoUrl = file.getUrl();
  }

  const id = 'I' + Date.now();
  sh.appendRow([id, name, qty, buyDate, expireDate, memo, photoUrl]);

  return { status: 'ok', photoUrl };
}

function getItems() {
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Inventory');
  const values = sh.getDataRange().getValues().slice(1);

  const items = values
    .filter(r => r[0])
    .map(r => ({
      id: r[0],
      name: r[1],
      qty: r[2],
      buyDate: r[3],
      expireDate: r[4],
      memo: r[5],
      photoUrl: r[6]
    }));

  return { items };
}
