const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generateMockups() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  
  // Start the dev server
  console.log('Starting development server...');
  // You'll need to start npm run dev separately
  
  // Wait for server to be ready
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Create mockups directory
  const mockupsDir = path.join(__dirname, 'mockups');
  if (!fs.existsSync(mockupsDir)) {
    fs.mkdirSync(mockupsDir);
  }

  // Generate different mockups
  const mockups = [
    {
      name: 'main-landing-page',
      url: 'http://localhost:3000',
      description: 'Main landing page with search interface'
    },
    {
      name: 'instructor-dashboard',
      url: 'http://localhost:3000/instructor',
      description: 'Instructor dashboard with analytics'
    },
    {
      name: 'preferences-page',
      url: 'http://localhost:3000/preferences',
      description: 'User preferences and settings'
    },
    {
      name: 'onboarding-flow',
      url: 'http://localhost:3000/onboarding',
      description: 'User onboarding process'
    }
  ];

  for (const mockup of mockups) {
    try {
      console.log(`Generating mockup: ${mockup.name}`);
      await page.goto(mockup.url, { waitUntil: 'networkidle0' });
      
      // Wait a bit for any animations to complete
      await page.waitForTimeout(2000);
      
      // Take screenshot
      await page.screenshot({
        path: path.join(mockupsDir, `${mockup.name}.png`),
        fullPage: true
      });
      
      console.log(`✓ Generated ${mockup.name}.png`);
    } catch (error) {
      console.error(`✗ Failed to generate ${mockup.name}:`, error.message);
    }
  }

  await browser.close();
  console.log('Mockup generation complete!');
}

// Run the generator
generateMockups().catch(console.error); 