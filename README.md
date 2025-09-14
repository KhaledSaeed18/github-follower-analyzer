# GitHub Follower Analyzer 📊

A simple Node.js tool to analyze your GitHub followers and following relationships. Find out who follows you back, who doesn't, and get detailed insights about your GitHub social connections.

## ✨ Features

- **Follower Analysis**: See who follows you vs who you follow
- **Mutual Connections**: Identify users who follow you back
- **One-way Relationships**: Find users you follow who don't follow back
- **Missed Connections**: Discover followers you haven't followed back
- **Multiple Output Formats**: Get results in JSON, TXT, and HTML formats
- **Auto-open Results**: Automatically opens the HTML report in your browser

## 🔧 Requirements

- **Node.js** — [Download Node.js](https://nodejs.org/en/download)
- **GitHub Personal Access Token** (classic token with `user` scope)

## 🚀 How to Run

### 1. Clone/Download the Project

```bash
git clone https://github.com/KhaledSaeed18/github-follower-analyzer.git
cd github-follower-analyzer
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

1. Copy the example environment file:

   ```bash
   copy .env.example .env
   ```

2. Edit the `.env` file and add your credentials:

   ```env
   GITHUB_TOKEN=your_github_token_here
   GITHUB_USERNAME=your_username_here
   ```

### 4. Get Your GitHub Token

1. Go to [GitHub Settings > Tokens](https://github.com/settings/tokens)
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a descriptive name (e.g., "Follower Analyzer")
4. Select the **`user`** scope (this gives read access to your profile and followers)
5. Click **"Generate token"**
6. **Copy the token immediately** (you won't be able to see it again!)
7. Paste it in your `.env` file as the `GITHUB_TOKEN` value

### 5. Run the Analyzer

```bash
node analyzer.js
```

## 📋 What You'll Get

The tool generates three types of output files in a `results` folder:

1. **JSON file** (`analysis-YYYYMMDD-HHMMSS.json`) - Raw data for programmatic use
2. **Text file** (`analysis-YYYYMMDD-HHMMSS.txt`) - Human-readable summary
3. **HTML file** (`analysis-YYYYMMDD-HHMMSS.html`) - Visual report that opens in your browser

### Sample Output

```text
📊 STATISTICS:
- Total Followers: 150
- Total Following: 200
- Mutual Follows: 120
- Don't Follow Back: 80
- You Don't Follow Back: 30

❌ PEOPLE YOU FOLLOW WHO DON'T FOLLOW BACK (80):
- @user1 - https://github.com/user1
- @user2 - https://github.com/user2
...
```

## ⚠️ Important Notes

- **Rate Limiting**: The tool respects GitHub's API rate limits (5000 requests/hour)
- **Token Security**: Never share your GitHub token or commit it to version control
- **Scope Requirements**: The token only needs `user` scope for basic follower analysis
- **Large Accounts**: Analysis may take several minutes for accounts with many followers/following

## 🔒 Privacy & Security

- Your token is stored locally in the `.env` file
- No data is sent to external services
- All analysis happens on your machine
- Generated reports are saved locally

## 🐛 Troubleshooting

### "Please set your GITHUB_TOKEN" error

- Make sure you've created a `.env` file
- Verify your token is correctly pasted (no extra spaces)
- Check that your token has the `user` scope

### "API Error" messages

- Verify your token is valid and not expired
- Check your internet connection
- Ensure your username is correct in the `.env` file

### Rate limiting issues

- The tool automatically handles rate limiting with delays
- If you hit limits, wait an hour and try again
