# Project rules

- Alert comparisons use `src/lib/alert-price.ts` to normalize invoice-inclusive purchase costs to individual units; this prevents package prices and embedded taxes from being counted twice.