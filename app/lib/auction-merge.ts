import type { AuctionItem } from "./auction-types";
import type { UserAuctionItem } from "./auction-storage";

export function mergeAuctionItems(
  sampleItems: AuctionItem[],
  userItems: UserAuctionItem[]
) {
  const sampleIds = new Set(sampleItems.map((item) => item.id));
  const uniqueUserItems = userItems.filter((item) => !sampleIds.has(item.id));

  return [
    ...uniqueUserItems.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    ...sampleItems,
  ];
}
