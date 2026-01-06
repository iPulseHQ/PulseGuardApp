---
description: Steps to troubleshoot and fix ngrok tunnel timeouts
---

If you are seeing `CommandError: ngrok tunnel took too long to connect`, follow these steps:

1. **Restart the tunnel**:
   Stop the running server (Ctrl+C) and try again:
   ```powershell
   npx expo start --tunnel
   ```

2. **Check ngrok status**:
   Ensure you don't have other ngrok processes running. Kill them if necessary:
   ```powershell
   taskkill /f /im ngrok.exe
   ```

3. **Use Local IP (if on same network)**:
   If your phone and computer are on the same Wi-Fi, you don't need a tunnel.
   ```powershell
   npx expo start
   ```
   (Scan the QR code with your phone).

4. **Authenticate ngrok**:
   If you haven't recently, refresh your auth token. Log in to [dashboard.ngrok.com](https://dashboard.ngrok.com), get your token, and run:
   ```powershell
   ngrok config add-authtoken <YOUR_TOKEN>
   ```

5. **Install ngrok globally (optional)**:
   Sometimes the embedded expo ngrok is flaky.
   ```powershell
   npm install -g ngrok
   ```
