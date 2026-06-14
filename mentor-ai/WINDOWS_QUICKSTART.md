# How to run Mentor AI on Windows

Follow these steps in order. Takes about 20 minutes the first time.

---

## Step 1 — Download the code

1. Open this link and click **"Download ZIP"**:  
   `https://github.com/benshi915/cyntro-app/archive/refs/heads/main.zip`

2. Unzip the file somewhere easy (e.g. your Desktop)

3. Go inside: `cyntro-app-main` → `mentor-ai`

---

## Step 2 — Install Docker Desktop

1. Go to: `https://www.docker.com/products/docker-desktop/`
2. Click **"Download for Windows"**
3. Run the installer
4. **Restart your computer** when it asks
5. After restart, open **Docker Desktop** from the Start menu
6. Wait until you see a small whale icon in the bottom taskbar — that means it's ready

> Docker is the database that stores all the AI knowledge. It must be running every time you use the app.

---

## Step 3 — Run setup (one time only)

1. Go into the `mentor-ai` folder
2. Right-click **`setup_windows.bat`** → **Run as administrator**
3. Click "Yes" if Windows asks for permission
4. Wait — it will install Python, Node.js, and all the packages automatically
5. When it says **"Setup complete!"** — you're done with this step

> If it stops and asks you to restart — restart, then double-click `setup_windows.bat` again.

---

## Step 4 — Start the app

Every time you want to use the app:

1. Make sure **Docker Desktop is open** (whale icon in taskbar)
2. Double-click **`start_windows.bat`**
3. Two black windows will open (Backend and Frontend) — keep them open
4. Your browser will open automatically at `http://localhost:3000`

---

## What you'll see

| Page | What it does |
|------|-------------|
| **Ask** | Type a question → get a prompt to paste into Claude.ai |
| **Add** | Paste YouTube links or web articles to feed the AI |
| **Sources** | See everything the AI has learned from |

---

## To stop the app

1. Close the two black windows (Backend and Frontend)
2. You can also stop Docker Desktop from the taskbar

---

## Something went wrong?

- **"Docker is not running"** → Open Docker Desktop and wait for the whale icon
- **"localhost refused to connect"** → The app isn't started yet, run `start_windows.bat`
- **Setup stopped with an error** → Take a screenshot and share it
