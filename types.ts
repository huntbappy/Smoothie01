export type Language = 'EN' | 'BN';
export type ViewMode = 'sales' | 'stock';

export interface ItemConfig {
  id: string;
  name: string;
  nameBN: string;
  price250: number;
  price350: number;
  color?: string; // Hex color for light background
  icon?: string;  // Fruit emoji or icon
}

export interface StockItemConfig {
  id: string;
  name: string;
  nameBN: string;
}

export interface DetailEntry {
  id: string;
  description: string;
  amount: number;
}

export interface DayData {
  quantities: Record<string, { q250: number; q350: number }>;
  purchase: number;
  expense: number;
  purchaseDetails?: DetailEntry[];
  expenseDetails?: DetailEntry[];
  previousBalance: number;
  notes: string;
  isSynced?: boolean;
  isLocked?: boolean;
}

export interface StockEntry {
  qty: number;
  taka: number;
}

export interface MonthStockData {
  items: Record<string, StockEntry>;
  isSynced?: boolean;
}

export interface AIAnalysisResponse {
  insight: string;
  suggestion: string;
  marketingHook: string;
}