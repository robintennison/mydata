// src/modules/Banking/styles/index.ts - FIXED VERSION
import { bankingStyles as bs } from './BankingStyles.tsx';
import { tableStyles as ts, injectTableGlobalStyles as itgs } from './TableStyles.tsx';
import { injectBankingGlobalStyles as ibgs } from './banking-global.ts';

// Export with clean names
export const bankingStyles = bs;
export const tableStyles = ts;
export const injectTableGlobalStyles = itgs;
export const injectBankingGlobalStyles = ibgs;

// Optional: Also export as default object
export default {
  bankingStyles: bs,
  tableStyles: ts,
  injectTableGlobalStyles: itgs,
  injectBankingGlobalStyles: ibgs,
};