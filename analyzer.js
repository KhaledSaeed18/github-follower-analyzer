const https = require('https');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const HtmlTemplateProcessor = require('./htmlTemplateProcessor');

// Load environment variables from .env file
require('dotenv').config();

class GitHubFollowerAnalyzer {
    constructor(token, username) {
        this.token = token;
        this.username = username;
        this.baseUrl = 'api.github.com';
        this.htmlProcessor = new HtmlTemplateProcessor();
    }

    // Make HTTP request to GitHub API
    makeRequest(path) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: this.baseUrl,
                path: path,
                method: 'GET',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'User-Agent': 'GitHub-Follower-Analyzer',
                    'Accept': 'application/vnd.github.v3+json'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        if (res.statusCode !== 200) {
                            reject(new Error(`GitHub API Error: ${jsonData.message || 'Unknown error'}`));
                        } else {
                            resolve(jsonData);
                        }
                    } catch (error) {
                        reject(new Error(`JSON Parse Error: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.end();
        });
    }

    // Get all pages of results
    async getAllPages(endpoint) {
        let allData = [];
        let page = 1;
        const perPage = 100; // GitHub's max per page

        while (true) {
            console.log(`📄 Fetching page ${page} from ${endpoint}...`);

            try {
                const data = await this.makeRequest(`${endpoint}?per_page=${perPage}&page=${page}`);

                if (data.length === 0) {
                    break; // No more data
                }

                allData = allData.concat(data);
                page++;

                // Rate limiting: GitHub allows 5000 requests per hour
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error(`❌ Error fetching page ${page}:`, error.message);
                break;
            }
        }

        return allData;
    }

    // Get all followers
    async getFollowers() {
        console.log('🔍 Fetching followers...');
        return await this.getAllPages(`/users/${this.username}/followers`);
    }

    // Get all following
    async getFollowing() {
        console.log('🔍 Fetching following...');
        return await this.getAllPages(`/users/${this.username}/following`);
    }

    // Analyze and find non-mutual follows
    analyzeFollows(followers, following) {
        const followerUsernames = new Set(followers.map(user => user.login));
        const followingUsernames = new Set(following.map(user => user.login));

        // People you follow but don't follow you back
        const notFollowingBack = following.filter(user =>
            !followerUsernames.has(user.login)
        );

        // People who follow you but you don't follow back
        const youDontFollowBack = followers.filter(user =>
            !followingUsernames.has(user.login)
        );

        return {
            notFollowingBack,
            youDontFollowBack,
            mutualFollows: following.filter(user => followerUsernames.has(user.login))
        };
    }

    // Generate HTML report using external template
    generateHtmlReport(analysis, followers, following) {
        try {
            return this.htmlProcessor.generateReport({
                username: this.username,
                analysis: analysis,
                followers: followers,
                following: following
            });
        } catch (error) {
            console.error('❌ Error generating HTML report:', error.message);
            return null;
        }
    }

    // Save results to files
    saveResults(analysis, followers, following) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        // Create results directory
        const resultsDir = 'github-analysis-results';
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir);
        }

        // Save detailed results
        const results = {
            timestamp: new Date().toISOString(),
            username: this.username,
            stats: {
                totalFollowers: followers.length,
                totalFollowing: following.length,
                notFollowingBack: analysis.notFollowingBack.length,
                youDontFollowBack: analysis.youDontFollowBack.length,
                mutualFollows: analysis.mutualFollows.length
            },
            notFollowingBack: analysis.notFollowingBack.map(user => ({
                username: user.login,
                profile: user.html_url,
                avatar: user.avatar_url
            })),
            youDontFollowBack: analysis.youDontFollowBack.map(user => ({
                username: user.login,
                profile: user.html_url,
                avatar: user.avatar_url
            })),
            mutualFollows: analysis.mutualFollows.map(user => ({
                username: user.login,
                profile: user.html_url,
                avatar: user.avatar_url
            }))
        };

        const filename = `${resultsDir}/analysis-${timestamp}.json`;
        fs.writeFileSync(filename, JSON.stringify(results, null, 2));

        // Save simple text file for easy reading
        const textResults = `
GitHub Follower Analysis for @${this.username}
Generated: ${new Date().toLocaleString()}

📊 STATISTICS:
- Total Followers: ${followers.length}
- Total Following: ${following.length}
- Mutual Follows: ${analysis.mutualFollows.length}
- Don't Follow Back: ${analysis.notFollowingBack.length}
- You Don't Follow Back: ${analysis.youDontFollowBack.length}

❌ PEOPLE YOU FOLLOW WHO DON'T FOLLOW BACK (${analysis.notFollowingBack.length}):
${analysis.notFollowingBack.map(user => `- @${user.login} - ${user.html_url}`).join('\n')}

💔 PEOPLE WHO FOLLOW YOU BUT YOU DON'T FOLLOW BACK (${analysis.youDontFollowBack.length}):
${analysis.youDontFollowBack.map(user => `- @${user.login} - ${user.html_url}`).join('\n')}

✅ MUTUAL FOLLOWS (${analysis.mutualFollows.length}):
${analysis.mutualFollows.map(user => `- @${user.login} - ${user.html_url}`).join('\n')}
`;

        const textFilename = `${resultsDir}/analysis-${timestamp}.txt`;
        fs.writeFileSync(textFilename, textResults);

        // Save HTML file
        let htmlFilename = null;
        try {
            const htmlContent = this.generateHtmlReport(analysis, followers, following);
            if (htmlContent) {
                htmlFilename = `${resultsDir}/analysis-${timestamp}.html`;
                fs.writeFileSync(htmlFilename, htmlContent);
            } else {
                console.error('❌ Failed to generate HTML content');
            }
        } catch (error) {
            console.error('❌ Error generating HTML file:', error.message);
        }

        return {
            jsonFile: filename,
            textFile: textFilename,
            htmlFile: htmlFilename
        };
    }

    // Open HTML file in default browser
    openInBrowser(filePath) {
        const absolutePath = path.resolve(filePath);
        const command = process.platform === 'win32' ? `start "" "${absolutePath}"` :
            process.platform === 'darwin' ? `open "${absolutePath}"` :
                `xdg-open "${absolutePath}"`;

        exec(command, (error) => {
            if (error) {
                console.error('❌ Error opening browser:', error.message);
            } else {
                console.log('🌐 HTML report opened in default browser');
            }
        });
    }

    // Main analysis function
    async analyze() {
        try {
            console.log(`🚀 Starting GitHub follower analysis for @${this.username}...\n`);

            const [followers, following] = await Promise.all([
                this.getFollowers(),
                this.getFollowing()
            ]);

            console.log(`\n📊 Found ${followers.length} followers and ${following.length} following\n`);

            const analysis = this.analyzeFollows(followers, following);
            const files = this.saveResults(analysis, followers, following);

            // Display results
            console.log('🎯 ANALYSIS COMPLETE!\n');
            console.log('📈 STATISTICS:');
            console.log(`   Followers: ${followers.length}`);
            console.log(`   Following: ${following.length}`);
            console.log(`   Mutual: ${analysis.mutualFollows.length}`);
            console.log(`   Don't follow back: ${analysis.notFollowingBack.length}`);
            console.log(`   You don't follow back: ${analysis.youDontFollowBack.length}\n`);

            if (analysis.notFollowingBack.length > 0) {
                console.log('❌ PEOPLE YOU FOLLOW WHO DON\'T FOLLOW BACK:');
                analysis.notFollowingBack.slice(0, 10).forEach(user => {
                    console.log(`   @${user.login} - ${user.html_url}`);
                });
                if (analysis.notFollowingBack.length > 10) {
                    console.log(`   ... and ${analysis.notFollowingBack.length - 10} more\n`);
                } else {
                    console.log('');
                }
            }

            console.log(`💾 Results saved to:`);
            console.log(`   JSON: ${files.jsonFile}`);
            console.log(`   TXT:  ${files.textFile}`);
            if (files.htmlFile) {
                console.log(`   HTML: ${files.htmlFile}`);
                // Open HTML file in default browser
                this.openInBrowser(files.htmlFile);
            } else {
                console.log(`   HTML: Failed to generate`);
            }

        } catch (error) {
            console.error('❌ Error during analysis:', error.message);
            process.exit(1);
        }
    }
}

// Configuration
const CONFIG = {
    // Load GitHub token from environment variable
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,

    // Load GitHub username from environment variable
    GITHUB_USERNAME: process.env.GITHUB_USERNAME
};

// Validate configuration
if (!CONFIG.GITHUB_TOKEN) {
    console.error('❌ Please set your GITHUB_TOKEN in the .env file');
    console.error('   Create a .env file with: GITHUB_TOKEN=your_token_here');
    process.exit(1);
}

if (!CONFIG.GITHUB_USERNAME) {
    console.error('❌ Please set your GITHUB_USERNAME in the .env file');
    console.error('   Add to .env file: GITHUB_USERNAME=your_username_here');
    process.exit(1);
}

// Run the analysis
const analyzer = new GitHubFollowerAnalyzer(CONFIG.GITHUB_TOKEN, CONFIG.GITHUB_USERNAME);
analyzer.analyze().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
});