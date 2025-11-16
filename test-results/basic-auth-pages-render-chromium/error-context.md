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
  - generic [ref=e17]:
    - generic [ref=e19]: Login
    - generic [ref=e20]:
      - generic [ref=e21]:
        - generic [ref=e22]: Email
        - textbox "Email" [ref=e23]:
          - /placeholder: you@example.com
      - generic [ref=e24]:
        - generic [ref=e25]: Password
        - textbox "Password" [ref=e26]:
          - /placeholder: "********"
      - button "Sign in" [ref=e27]
      - paragraph [ref=e28]:
        - text: Don't have an account?
        - link "Register" [ref=e29] [cursor=pointer]:
          - /url: /(auth)/register
  - alert [ref=e30]
```