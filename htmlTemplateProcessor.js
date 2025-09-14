const fs = require('fs');

class HtmlTemplateProcessor {
    constructor(templatePath = './template.html') {
        this.templatePath = templatePath;
        this.template = null;
    }

    // Load the HTML template
    loadTemplate() {
        try {
            this.template = fs.readFileSync(this.templatePath, 'utf8');
            return true;
        } catch (error) {
            console.error('❌ Error loading HTML template:', error.message);
            return false;
        }
    }

    // Generate user cards HTML for a list of users
    generateUserCards(users) {
        return users.map(user => `
                <div class="user-card">
                    <img src="${user.avatar_url}" alt="${user.login}" class="avatar">
                    <div class="user-info">
                        <a href="${user.html_url}" target="_blank" class="username">@${user.login}</a>
                    </div>
                </div>
                `).join('');
    }

    // Generate a section with users
    generateSection(title, users, cssClass, emoji) {
        if (users.length === 0) {
            return '';
        }

        return `
        <div class="section ${cssClass}">
            <h2 class="section-title">${emoji} ${title} (${users.length})</h2>
            <div class="user-grid">
                ${this.generateUserCards(users)}
            </div>
        </div>
        `;
    }

    // Generate the complete HTML report
    generateReport(data) {
        if (!this.template) {
            if (!this.loadTemplate()) {
                throw new Error('Failed to load HTML template');
            }
        }

        const { username, analysis, followers, following } = data;

        // Generate sections
        const notFollowingBackSection = this.generateSection(
            'People You Follow Who Don\'t Follow Back',
            analysis.notFollowingBack,
            'not-following',
            '❌'
        );

        const youDontFollowBackSection = this.generateSection(
            'People Who Follow You But You Don\'t Follow Back',
            analysis.youDontFollowBack,
            'you-dont-follow',
            '💔'
        );

        const mutualFollowsSection = this.generateSection(
            'Mutual Follows',
            analysis.mutualFollows,
            'mutual',
            '✅'
        );

        // Replace all placeholders
        let html = this.template
            .replace(/{{USERNAME}}/g, username)
            .replace(/{{TIMESTAMP}}/g, new Date().toLocaleString())
            .replace(/{{FOLLOWERS_COUNT}}/g, followers.length)
            .replace(/{{FOLLOWING_COUNT}}/g, following.length)
            .replace(/{{MUTUAL_COUNT}}/g, analysis.mutualFollows.length)
            .replace(/{{NOT_FOLLOWING_BACK_COUNT}}/g, analysis.notFollowingBack.length)
            .replace(/{{YOU_DONT_FOLLOW_BACK_COUNT}}/g, analysis.youDontFollowBack.length)
            .replace(/{{NOT_FOLLOWING_BACK_SECTION}}/g, notFollowingBackSection)
            .replace(/{{YOU_DONT_FOLLOW_BACK_SECTION}}/g, youDontFollowBackSection)
            .replace(/{{MUTUAL_FOLLOWS_SECTION}}/g, mutualFollowsSection);

        return html;
    }
}

module.exports = HtmlTemplateProcessor;