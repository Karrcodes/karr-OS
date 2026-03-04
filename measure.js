const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/system/control-centre');
    await page.waitForSelector('.min-h-screen > div:first-child');
    const headerRect = await page.evaluate(() => {
        const header = document.querySelector('.min-h-screen > div:first-child');
        return header ? header.getBoundingClientRect() : null;
    });
    console.log("HEADER_HEIGHT_EXACT:", headerRect ? headerRect.height : 'Not found');
    
    // Also measure the logo container
    const logoRect = await page.evaluate(() => {
        const logo = document.querySelector('aside > div:first-child');
        return logo ? logo.getBoundingClientRect() : null;
    });
    console.log("LOGO_HEIGHT_EXACT:", logoRect ? logoRect.height : 'Not found');

    await browser.close();
})();
