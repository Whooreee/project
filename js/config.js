const PASSWORD  = '1488';
const CLOUD_DB  = 'https://proxytherm-e2db4-default-rtdb.firebaseio.com';
const STORE_KEY = 'sklad-v1';

let state = { materials: [], products: [], writeoffs: [] };
let newProdMats  = [];
let editProdMats = [];
let woItems      = [{ prodId: '', qty: 1 }];
let modalCallback = null;
let summaryDay = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
