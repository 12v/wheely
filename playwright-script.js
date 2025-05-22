// playwright-script.js
// This script uses Playwright to automate the described actions on the target website
const { chromium } = require('playwright');
const { faker } = require('@faker-js/faker');

// Read email domain and URL from environment variables (set as GitHub Actions secrets)
const emailDomain = process.env.SUBSCRIBER_EMAIL_DOMAIN;
const targetUrl = process.env.TARGET_URL;

if (!emailDomain || !targetUrl) {
    throw new Error('SUBSCRIBER_EMAIL_DOMAIN and TARGET_URL environment variables must be set.');
}

const userAgent = faker.internet.userAgent();
const subscriberEmail = faker.internet.email({ provider: emailDomain });

console.log(`User Agent: ${userAgent}`);
console.log(`Email Address: ${subscriberEmail}`);
console.log(`Target URL: ${targetUrl}`);

(async () => {
    const headless = process.env.HEADLESS === 'true';
    const browser = await chromium.launch({ headless });
    const context = await browser.newContext({
        userAgent: userAgent,
    });
    const page = await context.newPage();
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    // Scroll to the bottom slowly
    await page.evaluate(async () => {
        const scrollStep = 100;
        const delay = 200;
        let currentPosition = 0;
        while (currentPosition < document.body.scrollHeight) {
            window.scrollTo(0, currentPosition);
            await new Promise(r => setTimeout(r, delay));
            currentPosition += scrollStep;
        }
        window.scrollTo(0, document.body.scrollHeight);
    });

    // Wait for the email input inside form.kaviyo-form
    await page.waitForSelector('form.klaviyo-form input[type="email"][name="email"][placeholder="Email"]', { state: "attached", timeout: 20000 });

    // Enter the email address
    await page.type('form.klaviyo-form input[type="email"][name="email"][placeholder="Email"]', subscriberEmail, { delay: 100 });

    await page.waitForTimeout(1000);

    // Click the button with text "Let's Go" inside the form
    await page.click('form.klaviyo-form button:has-text("Let\'s Go")');

    // Wait for the page to update (e.g., confirmation message or input disappears)
    await page.waitForTimeout(3000);

    // Take a screenshot
    await page.screenshot({ path: 'subscribe_result.png', fullPage: true });

    await browser.close();
})();
