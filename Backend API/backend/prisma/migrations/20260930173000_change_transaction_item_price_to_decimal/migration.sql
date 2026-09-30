/*
  Change transaction item historical prices from floating-point to exact decimal.

  Existing values are preserved by explicitly casting the current double-precision
  values to PostgreSQL DECIMAL before changing the column type.
*/
ALTER TABLE "TransactionItem"
ALTER COLUMN "priceAtTime" SET DATA TYPE DECIMAL(65,30)
USING "priceAtTime"::DECIMAL(65,30);
