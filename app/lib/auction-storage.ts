import type { AuctionItem, ComparableSale } from "./auction-types";

export const USER_ITEMS_STORAGE_KEY = "auction-risk-analyzer:user-items:v1";

export type UserAuctionItem = AuctionItem & {
  source: "user";
  createdAt: string;
  updatedAt: string;
};

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function browserStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function numberOrZero(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function normalizeComparableSale(value: unknown, index: number): ComparableSale | null {
  if (!value || typeof value !== "object") return null;

  const sale = value as Partial<ComparableSale>;
  const price = numberOrZero(sale.price);
  const label = typeof sale.label === "string" ? sale.label.trim() : "";
  const tradeDate = typeof sale.tradeDate === "string" ? sale.tradeDate : "";
  const area = numberOrZero(sale.area);
  const floor = typeof sale.floor === "string" ? sale.floor.trim() : "";
  const memo = typeof sale.memo === "string" ? sale.memo.trim() : "";

  if (!label && !tradeDate && !area && !floor && !price && !memo) return null;
  if (price <= 0) return null;

  return {
    id: typeof sale.id === "string" && sale.id ? sale.id : `comp-${index + 1}`,
    label,
    tradeDate,
    area,
    floor,
    price,
    memo,
  };
}

function normalizeUserAuctionItem(value: unknown): UserAuctionItem | null {
  if (!value || typeof value !== "object") return null;

  const item = value as Partial<UserAuctionItem>;
  if (typeof item.id !== "string" || !item.id.startsWith("user-")) return null;
  if (item.source !== "user") return null;
  if (typeof item.title !== "string" || item.title.trim().length === 0) return null;

  return {
    id: item.id,
    source: "user",
    createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
    updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : new Date().toISOString(),
    channel: item.channel === "공매" ? "공매" : "경매",
    agency: typeof item.agency === "string" ? item.agency : "직접 입력",
    caseNo: typeof item.caseNo === "string" ? item.caseNo : "",
    sourceUrl: typeof item.sourceUrl === "string" ? item.sourceUrl : "",
    title: item.title,
    type:
      item.type === "빌라" || item.type === "오피스텔" || item.type === "아파트"
        ? item.type
        : "아파트",
    district: typeof item.district === "string" ? item.district : "",
    address: typeof item.address === "string" ? item.address : "",
    appraised: numberOrZero(item.appraised),
    minimum: numberOrZero(item.minimum),
    market: numberOrZero(item.market),
    lastTrade: numberOrZero(item.lastTrade),
    deposit: numberOrZero(item.deposit),
    monthlyRent: numberOrZero(item.monthlyRent),
    area: numberOrZero(item.area),
    floor: typeof item.floor === "string" ? item.floor : "",
    failedBids: numberOrZero(item.failedBids),
    auctionDate: typeof item.auctionDate === "string" ? item.auctionDate : "",
    tenant:
      item.tenant === "없음" ||
      item.tenant === "전입 있음" ||
      item.tenant === "대항력 가능" ||
      item.tenant === "확인 필요"
        ? item.tenant
        : "확인 필요",
    seniorDeposit: numberOrZero(item.seniorDeposit),
    takeoverAmount: numberOrZero(item.takeoverAmount),
    liens: Boolean(item.liens),
    illegalBuilding: Boolean(item.illegalBuilding),
    taxRisk: Boolean(item.taxRisk),
    occupancy:
      item.occupancy === "명도 쉬움" ||
      item.occupancy === "협의 필요" ||
      item.occupancy === "명도 난이도 높음"
        ? item.occupancy
        : "협의 필요",
    notes: Array.isArray(item.notes)
      ? item.notes.filter((note): note is string => typeof note === "string")
      : [],
    userMemo: typeof item.userMemo === "string" ? item.userMemo : "",
    comparableSales: Array.isArray(item.comparableSales)
      ? item.comparableSales
          .map((sale, index) => normalizeComparableSale(sale, index))
          .filter((sale): sale is ComparableSale => Boolean(sale))
          .slice(0, 3)
      : [],
  };
}

export function loadUserAuctionItems(storage: StorageLike | null = browserStorage()) {
  if (!storage) return [];

  try {
    const raw = storage.getItem(USER_ITEMS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => normalizeUserAuctionItem(item))
      .filter((item): item is UserAuctionItem => Boolean(item));
  } catch {
    return [];
  }
}

export function saveUserAuctionItems(
  items: UserAuctionItem[],
  storage: StorageLike | null = browserStorage()
) {
  if (!storage) return;
  storage.setItem(USER_ITEMS_STORAGE_KEY, JSON.stringify(items));
}

export function createUserAuctionItem(
  input: Omit<UserAuctionItem, "id" | "source" | "createdAt" | "updatedAt">,
  now = new Date()
): UserAuctionItem {
  const timestamp = now.toISOString();
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `user-${crypto.randomUUID()}`
      : `user-${timestamp}-${Math.random().toString(36).slice(2)}`;

  return {
    ...input,
    id,
    source: "user",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function upsertUserAuctionItem(
  items: UserAuctionItem[],
  nextItem: UserAuctionItem,
  now = new Date()
) {
  const updatedItem = { ...nextItem, updatedAt: now.toISOString() };
  const exists = items.some((item) => item.id === nextItem.id);
  return exists
    ? items.map((item) => (item.id === nextItem.id ? updatedItem : item))
    : [updatedItem, ...items];
}

export function deleteUserAuctionItem(items: UserAuctionItem[], id: string) {
  return items.filter((item) => item.id !== id);
}
