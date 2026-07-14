import XLSX from 'xlsx';
import fs from 'fs';

const excelPath = './src/assets/json/data.xlsx';
const customerPath = './src/assets/json/customer.json';
const transactionPath = './src/assets/json/transaction.json';
const paymentPath = './src/assets/json/payment.json';

const customerFields = [
  'CustomerCode',
  'CustomerName',
  'HPNumber',
  'Email',
  'SexName',
  'DateOfBirth',
  'Address',
  'CityName',
  'StateName',
  'JoinDate'
];

const transactionFields = [
  'POSInvoice',
  'CalendarDate',
  'CustomerCode',
  'BrandName',
  'DepartmentName',
  'GroupName',
  'CategoryName',
  'SubcategoryName',
  'StoreCode',
  'StoreName',
  'QtySales',
  'Amount',
  'ChannelTrx',
  'CustomerStatus',
  'AgentCode'
];

const paymentFields = [
  'POSInvoice',
  'PaymentDate',
  'CustomerCode',
  'CardName',
  'CardHolder',
  'CardNo',
  'PaymentAmount',
  'CardType',
  'EDCCode',
  'EDCName',
  'TenderType',
  'TenderName',
  'TRNTYPE',
  'IO',
  'ApprovalCode'
];

function mapField(row, field, isDateField = false) {
  const targetClean = field.toLowerCase().replace(/[^a-z0-9]/g, '');
  const matchedKey = Object.keys(row).find(k => {
    const kClean = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    return kClean === targetClean;
  });
  
  let val = matchedKey !== undefined ? row[matchedKey] : null;
  
  if (val && isDateField) {
    if (typeof val === 'number') {
      // Excel date format conversion
      const date = new Date((val - 25569) * 86400 * 1000);
      val = date.toISOString().split('T')[0];
    } else if (typeof val === 'string' && val.includes('/')) {
      const dateObj = new Date(val);
      if (!isNaN(dateObj.getTime())) {
        val = dateObj.toISOString().split('T')[0];
      }
    }
  }
  return val;
}

try {
  console.log("Reading workbook from:", excelPath);
  const workbook = XLSX.readFile(excelPath);
  console.log("Sheets found:", workbook.SheetNames);

  // 1. Data_Transaction sheet
  const txSheetName = 'Data_Transaction';
  const txWorksheet = workbook.Sheets[txSheetName];
  if (txWorksheet) {
    const txRawData = XLSX.utils.sheet_to_json(txWorksheet);
    console.log(`Successfully read ${txRawData.length} rows from sheet: ${txSheetName}`);

    // Generate Customer JSON
    const customerData = txRawData.map(row => {
      const mapped = {};
      for (const field of customerFields) {
        mapped[field] = mapField(row, field, field === 'DateOfBirth' || field === 'JoinDate');
      }
      return mapped;
    });
    fs.writeFileSync(customerPath, JSON.stringify(customerData, null, 2), 'utf-8');
    console.log(`Successfully wrote ${customerData.length} records to ${customerPath}`);

    // Generate Transaction JSON
    const transactionData = txRawData.map(row => {
      const mapped = {};
      for (const field of transactionFields) {
        mapped[field] = mapField(row, field, field === 'CalendarDate');
      }
      return mapped;
    });
    fs.writeFileSync(transactionPath, JSON.stringify(transactionData, null, 2), 'utf-8');
    console.log(`Successfully wrote ${transactionData.length} records to ${transactionPath}`);
  } else {
    console.error(`Sheet not found: ${txSheetName}`);
  }

  // 2. Data_payment sheet
  const paySheetName = 'Data_Payment';
  const payWorksheet = workbook.Sheets[paySheetName];
  if (payWorksheet) {
    const payRawData = XLSX.utils.sheet_to_json(payWorksheet);
    console.log(`Successfully read ${payRawData.length} rows from sheet: ${paySheetName}`);

    // Generate Payment JSON
    const paymentData = payRawData.map(row => {
      const mapped = {};
      for (const field of paymentFields) {
        mapped[field] = mapField(row, field, field === 'PaymentDate');
      }
      return mapped;
    });
    fs.writeFileSync(paymentPath, JSON.stringify(paymentData, null, 2), 'utf-8');
    console.log(`Successfully wrote ${paymentData.length} records to ${paymentPath}`);
  } else {
    console.error(`Sheet not found: ${paySheetName}`);
  }

} catch (error) {
  console.error("Error during conversion:", error);
  process.exit(1);
}
