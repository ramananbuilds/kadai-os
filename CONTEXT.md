# Kadai OS

The counter operating system for small Indian retail shops: one shop's
billing, stock, and customer loyalty in one place.

## Language

**Shop**:
A single retail store — the unit of tenancy. Catalog, customers, and bills
all belong to exactly one Shop.
_Avoid_: store, merchant, business, account

**Shop Member**:
A person who operates the counter for a Shop — its owner or staff.
_Avoid_: employee, cashier, user

**User**:
An authentication identity (a phone number). A User becomes a Shop Member
of one or more Shops. Never a shopper.
_Avoid_: account, login

**Customer**:
A shopper enrolled in a Shop's loyalty program, identified by phone number.
_Avoid_: member (collides with Shop Member), client, buyer

**Walk-in**:
A shopper without a Customer record. A Bill may belong to no one.

**Bill**:
A completed sale at the counter — items, discount, tender, and loyalty
effects as one unit.
_Avoid_: invoice, order, transaction, receipt

**Receipt**:
The printed artifact produced from a Bill.
_Avoid_: bill (the Bill is the record; the Receipt is the paper)

**Bill Item**:
One product line on a Bill, frozen at the moment of sale.
_Avoid_: line item, order line

**Tender**:
How a Bill was settled — cash, UPI, or card. v1 records tender; it does not
take payments.
_Avoid_: payment, payment method

**Discount**:
A percentage reduction applied to a whole Bill before loyalty.
_Avoid_: offer, rebate

**Product**:
A sellable item in the Shop's catalog.
_Avoid_: item, article, SKU (the SKU is the code, not the thing)

**SKU**:
A Shop's own code identifying a Product.
_Avoid_: code, product id

**Barcode**:
The EAN/UPC printed on an item, used to find a Product while billing.

**Stock**:
Units of a Product on hand right now. Derived, never edited in place.
_Avoid_: inventory (screen label only), quantity

**Stock Movement**:
One signed change to Stock — sale, restock, adjustment, or return. The
journal; Stock is its running total.
_Avoid_: stock change, transaction

**Reorder Level**:
The Stock threshold at which a Product is flagged for reorder.

**Points**:
The Shop's loyalty currency — whole numbers that behave like store credit.
_Avoid_: credits, coins, cashback

**Loyalty Ledger**:
The append-only record of every Points change. The source of truth for
balances.
_Avoid_: points history, wallet

**Earn Rule**:
How many Points a Bill earns per ₹100 spent.

**Tier**:
The loyalty band a Customer sits in — Silver, Gold, or Platinum — derived
from Points.
_Avoid_: level, status

**Reward**:
A catalog offer a Customer unlocks by spending Points.
_Avoid_: coupon, offer, promo

**Redemption**:
Points spent against a Reward or a Bill.
_Avoid_: burn, usage
