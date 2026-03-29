# Upload MyDem to GitHub (new public repo)

Your account: **officialpathania** on [GitHub](https://github.com/).

---

## Part 1 — Create the empty repo on GitHub (website)

1. Open [https://github.com/](https://github.com/) and sign in.
2. Click the **+** (top right) → **New repository** (or green **New** next to “Top repositories”).
3. **Repository name:** e.g. `MyDem` (or any name you like).
4. **Description:** optional one line.
5. Choose **Public**.
6. **Do not** add a README, .gitignore, or license on this screen (you already have them locally).
7. Click **Create repository**.

GitHub will show a page with commands — you will use **your** repo URL below, for example:

- HTTPS: `https://github.com/officialpathania/MyDem.git`
- SSH: `git@github.com:officialpathania/MyDem.git`

---

## Part 2 — Git on your Mac (Terminal)

Open **Terminal** and run these from your project folder (adjust the path if yours differs):

```bash
cd /Users/souravpathania/Documents/MyWorkSpace/MyDem
```

### 2a. If Git is not initialized yet

```bash
git init -b main
```

### 2b. If Git was already started (you see “No commits yet” or old staged files)

Reset staging so you get one clean first commit:

```bash
git reset
```

### 2c. Check you are not about to commit secrets

```bash
git status
```

You should **not** see:

- `android/keystore.properties`
- `android/keystore/mydem-release.keystore` (any release keystore)

They are in `.gitignore`. If they appear, **do not** `git add` them.

### 2d. Stage everything safe

```bash
git add .
```

### 2e. First commit

```bash
git commit -m "Initial commit: React Native app with custom native module"
```

If Git asks for your name/email:

```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

Then run `git commit` again.

### 2f. Connect to GitHub and push

Replace `MyDem` with your real repo name if different.

**HTTPS:**

```bash
git remote add origin https://github.com/officialpathania/MyDem.git
git push -u origin main
```

**SSH** (only if you already added an SSH key to GitHub):

```bash
git remote add origin git@github.com:officialpathania/MyDem.git
git push -u origin main
```

First HTTPS push: GitHub may ask you to sign in; use a **Personal Access Token** as the password (not your GitHub account password). Create one under: GitHub → **Settings** → **Developer settings** → **Personal access tokens**.

---

## Part 3 — After the first push

- Refresh your repo page on GitHub — you should see all files.
- `node_modules/` and build artifacts stay out of Git because of `.gitignore`.

---

## Later changes

```bash
git add .
git commit -m "Describe what you changed"
git push
```

---

## Security checklist (public repo)

- [ ] No `keystore.properties` in the repo  
- [ ] No release `.keystore` in the repo (only `debug.keystore` is allowed by this project’s `.gitignore` rules)  
- [ ] No real passwords in README or docs (use placeholders + local files only)

Your project is set up so release signing secrets stay local.
