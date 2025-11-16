# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - heading "Estate Portal" [level=1] [ref=e7]
        - generic [ref=e9]:
          - link "Dashboard" [ref=e10] [cursor=pointer]:
            - /url: /dashboard
          - link "Transactions" [ref=e11] [cursor=pointer]:
            - /url: /transactions
      - generic [ref=e13]:
        - link "Login" [ref=e14] [cursor=pointer]:
          - /url: /login
        - link "Register" [ref=e15] [cursor=pointer]:
          - /url: /register
  - alert [ref=e16]: Estate Portal
  - generic [ref=e17]:
    - heading "Unknown Transaction (undefined)" [level=1] [ref=e18]:
      - text: Unknown Transaction
      - generic [ref=e19]: (undefined)
    - generic [ref=e20]:
      - text: No data found for this transaction id.
      - generic [ref=e21]: "Available sample IDs: tx-001, tx-002"
```