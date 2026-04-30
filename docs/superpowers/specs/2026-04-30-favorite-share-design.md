# Favorite Share Design

## Goal

Allow a user to share their current equipment favorites so friends can open the mini program, view the shared set, and optionally save it into their own local favorites.

## Approach

Use a lightweight URL payload instead of a database. The share payload stores class keys and item IDs only, capped to 20 favorite items. When a friend opens the link, the mini program loads the existing COS class JSON files and reconstructs the favorite item snapshots from canonical data.

## User Flow

- The favorites panel shows a share action when favorites exist.
- The share card title summarizes the shared classes, for example `我的艾泽配装收藏：死亡骑士、法师`.
- Opening a shared link shows a read-only shared favorites panel.
- The viewer can tap equipment to inspect details.
- The viewer can tap `保存到我的收藏夹`; existing favorites are skipped and new favorites are merged.

## Data Contract

The index page accepts:

```text
shareFav=deathknight:151329,151308;mage:151400
```

The payload is URL-encoded in the share path. Each class segment is `classKey:itemId,itemId`. The page validates class keys by attempting to load class data and ignores missing items.

## Error Handling

- Empty or invalid payloads show a short failure message and do not open the shared panel.
- Missing item IDs are ignored.
- If no items can be restored, show `分享内容已失效`.
- Importing merges with local favorites and reports saved/skipped counts.

## Testing

Manual checks cover:

- Share title for one, two, and three-plus classes.
- Opening a multi-class shared link.
- Viewing shared item details.
- Importing with no duplicates.
- Importing when some items already exist.
