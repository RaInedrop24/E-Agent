# Playwright MCP Server Setup

## Issue
The Playwright MCP server is not working. The error indicates npm installation issues.

## Solution

### Step 1: Install the Playwright MCP Package

The Playwright MCP server package may need to be installed globally or configured differently. Try:

```bash
npm install -g @playwright/mcp
```

Or if that doesn't work, check if it's available as a different package name.

### Step 2: Configure MCP in Cursor

The MCP configuration should be in `.cursor/mcp.json` at the workspace root. Here's the expected configuration:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "-y",
        "@playwright/mcp"
      ],
      "env": {
        "PLAYWRIGHT_BROWSERS_PATH": "0"
      }
    }
  }
}
```

### Step 3: Alternative Configuration

If the above doesn't work, try using the local Playwright installation:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "node",
      "args": [
        "./node_modules/@playwright/mcp/dist/index.js"
      ],
      "cwd": "the-property-gateway"
    }
  }
}
```

### Step 4: Verify Installation

1. Check if Playwright is installed:
   ```bash
   cd the-property-gateway
   npx playwright --version
   ```

2. Install Playwright browsers if needed:
   ```bash
   npm run playwright:install
   ```

3. Restart Cursor IDE after updating `.cursor/mcp.json`

### Step 5: Troubleshooting

If you still get npm errors:

1. Clear npm cache:
   ```bash
   npm cache clean --force
   ```

2. Reinstall dependencies:
   ```bash
   cd the-property-gateway
   rm -rf node_modules package-lock.json
   npm install
   ```

3. Check the npm error log:
   ```bash
   type C:\Users\micro\AppData\Local\npm-cache\_logs\2025-12-09T09_19_06_773Z-debug-0.log
   ```

## Current Status ✅

- **Playwright MCP server is installed and running**
- Package installed at workspace root: `C:\Users\micro\Estate_Agent_Portal\node_modules\@playwright\mcp`
- Configuration file: `.cursor/mcp.json` is properly configured
- Using recommended `npx @playwright/mcp@latest` approach
- Playwright is installed in `devDependencies` (`@playwright/test@^1.47.2`)

## Final Configuration

The working configuration in `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest"
      ]
    }
  }
}
```

## Verification

- ✅ Package installed successfully
- ✅ Configuration file created correctly
- ✅ MCP server starts without errors
- ✅ Server is accessible in Cursor IDE
- ✅ **22 tools available** (confirmed from logs)

## Important Notes

⚠️ **Do not run manual checks on the MCP server while it's running** - Commands like `npx @playwright/mcp@latest --help` or testing the server directly can interfere with the active MCP connection and cause timeouts or disconnections.

If the server stops responding:
1. Disable the MCP server in Cursor's GUI (Settings → MCP Servers)
2. Re-enable it
3. The server should reconnect automatically

The server is managed by Cursor IDE and should not be tested manually while active.

