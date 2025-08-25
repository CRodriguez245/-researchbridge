const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'portfolio-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

// Pages to screenshot
const pages = [
  {
    name: 'main-page',
    url: 'http://localhost:3000',
    description: 'Main ResearchBridge interface with elegant styling'
  },
  {
    name: 'instructor-dashboard',
    url: 'http://localhost:3000/instructor',
    description: 'Instructor dashboard with analytics and student monitoring'
  },
  {
    name: 'settings-page',
    url: 'http://localhost:3000/settings',
    description: 'User settings and preferences management'
  },
  {
    name: 'signin-page',
    url: 'http://localhost:3000/auth/signin',
    description: 'Authentication sign-in page'
  },
  {
    name: 'signup-page',
    url: 'http://localhost:3000/auth/signup',
    description: 'User registration page'
  },
  {
    name: 'onboarding-page',
    url: 'http://localhost:3000/onboarding',
    description: 'User onboarding flow'
  }
];

// Device configurations for different viewports
const devices = [
  {
    name: 'desktop',
    width: 1920,
    height: 1080,
    deviceScaleFactor: 2
  },
  {
    name: 'tablet',
    width: 768,
    height: 1024,
    deviceScaleFactor: 2
  },
  {
    name: 'mobile',
    width: 375,
    height: 667,
    deviceScaleFactor: 2
  }
];

async function takeScreenshots() {
  console.log('🚀 Starting portfolio screenshots...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (const page of pages) {
      console.log(`📸 Taking screenshots for: ${page.name}`);
      
      const browserPage = await browser.newPage();
      
      // Set viewport and user agent
      await browserPage.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 2
      });
      
      await browserPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Navigate to page
      await browserPage.goto(page.url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait a bit for any animations to complete
      await browserPage.waitForTimeout(2000);

      // Take screenshots for different device sizes
      for (const device of devices) {
        await browserPage.setViewport({
          width: device.width,
          height: device.height,
          deviceScaleFactor: device.deviceScaleFactor
        });

        // Wait for layout to adjust
        await browserPage.waitForTimeout(1000);

        const filename = `${page.name}-${device.name}.png`;
        const filepath = path.join(screenshotsDir, filename);
        
        await browserPage.screenshot({
          path: filepath,
          fullPage: true,
          quality: 100
        });

        console.log(`  ✅ ${filename}`);
      }

      await browserPage.close();
    }

    console.log('\n🎉 All screenshots completed!');
    console.log(`📁 Screenshots saved to: ${screenshotsDir}`);
    
    // Create a README file with descriptions
    const readmeContent = `# Portfolio Screenshots

This directory contains high-quality screenshots of the ResearchBridge application for portfolio use.

## Screenshots Included:

${pages.map(page => `- **${page.name}**: ${page.description}`).join('\n')}

## Device Sizes:
- **Desktop**: 1920x1080 (2x scale)
- **Tablet**: 768x1024 (2x scale)  
- **Mobile**: 375x667 (2x scale)

## Usage:
These screenshots showcase the elegant, modern design with:
- Sophisticated color palette (slate and blue tones)
- Glassmorphism effects
- Gradient backgrounds and text
- Consistent rounded corners
- Professional typography
- Responsive design across devices

Generated on: ${new Date().toLocaleDateString()}
`;

    fs.writeFileSync(path.join(screenshotsDir, 'README.md'), readmeContent);
    console.log('📝 README.md created with descriptions');

  } catch (error) {
    console.error('❌ Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000');
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking if server is running...');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Server not running on http://localhost:3000');
    console.log('💡 Please start the server with: npm run dev');
    process.exit(1);
  }

  console.log('✅ Server is running!');
  await takeScreenshots();
}

main().catch(console.error); 