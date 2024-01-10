const fs = require("fs");
const express = require("express");
const app = express();
const port = 9000;
const puppeteer = require('puppeteer');
const testPage = async (page, testName, url) => {
  await page.goto(url);
  let totalFirstPaintTime = 0;
  let totalRenderingTime = 0;
  let totalMemoryUsage = 0;
  let totalLoadTime = 0;
  let totalActionResult = 0;

  for (let i = 0; i < 10; i++) {

    await page.goto(url);
    const loadTime = await page.evaluate(() => performance.now());
    await page.waitForSelector('#home-element');
    const loadTimeResult = `Время загрузки страницы: ${loadTime} ms`;
    totalLoadTime += loadTime

    const firstPaintTime = await page.evaluate(() => {
      const performanceTiming = performance.timing;
      return performanceTiming.responseStart - performanceTiming.navigationStart;
    });
    const performanceTimingResult = `Время первой отрисовки: ${firstPaintTime} ms`;
    totalFirstPaintTime += firstPaintTime

    const renderingTime = await page.evaluate(() => {
      const performanceTiming = performance.timing;
      return performanceTiming.loadEventEnd - performanceTiming.responseStart;
    });
    const renderingTimeResult = `Время рендеринга: ${renderingTime} ms`
    totalRenderingTime += renderingTime

    const memoryUsage = await page.evaluate(() => {
      if ('memory' in window.performance) {
        return (window.performance).memory.usedJSHeapSize / (1024 * 1024);

      } else {
        console.error('Браузер не поддерживает свойство memory в объекте Performance.');
      }
    });

    const memoryUsageResult = `Потребление памяти: ${memoryUsage} MB`
    totalMemoryUsage += memoryUsage

    const startActions = Date.now();
    await page.click("#post-link");
    await page.waitForSelector('#posts #post:nth-child(10)');
    await page.click('#posts #post:nth-child(10)');
    await page.waitForSelector('#post-body');
    await page.goto(url);
    await page.waitForSelector('#home-element');
    await page.click("#photo-link");
    await page.waitForSelector("#photos #photo:nth-child(10)");
    await page.goto(url + 'photo/10');
    await page.waitForSelector('#real-photo');
    await page.goto(url);
    await page.waitForSelector('#home-element');
    await page.goto(url + 'post');
    await page.waitForSelector('#posts #post:nth-child(10)');
    await page.click('#posts #post:nth-child(10)');
    const endActions = Date.now();
    const actionsResult = `Время выполнения различных действий на сайте: ${endActions - startActions} мс`;
    totalActionResult += endActions - startActions


    const testResults = {
      url: url,
      name: testName,
      loadTimeResult,
      performanceTimingResult,
      renderingTimeResult,
      memoryUsageResult,
      actionsResult,
    };
    fs.appendFileSync('testResults.json', JSON.stringify(testResults) + ',\n');
  }


  const averageFirstPaintTime = totalFirstPaintTime / 10;
  const averageRenderingTime = totalRenderingTime / 10;
  const averageTotalMemoryUsage = totalMemoryUsage / 10;
  const averageTotalLoadTime = totalLoadTime / 10;
  const averageActionsResult = totalActionResult / 10;

  console.log(testName)
  console.log(`Среднее время первой отрисовки: ${averageFirstPaintTime} ms`);
  console.log(`Среднее время рендеринга: ${averageRenderingTime} ms`);
  console.log(`Среднее время потребление памяти: ${averageTotalMemoryUsage} ms`);
  console.log(`Среднее время загрузки страницы: ${averageTotalLoadTime} ms`);
  console.log(`Среднее время выполнения различных действий на сайте: ${averageActionsResult} ms`);
  let content = fs.readFileSync('testResults.json', 'utf-8');
  if (content.length === 0) {
    fs.appendFileSync('testResults.json', '[\n');
  } else {
    content = content.slice(0, -2);
    fs.writeFileSync('testResults.json', content + ',\n', 'utf-8');
  }

};


app.use('/test', (req, res, next) => {
  req.setTimeout(280000);
  next();
});

app.get('/test', async (req, res) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await testPage(page, 'Тест Next', 'http://localhost:3000/');
    res.json({ message: 'Test completed successfully' });
  } catch (error) {
    console.error('Test failed:', error);
    res.status(500).json({ error: 'Test failed' });
  } finally {
    await browser.close();
  }
});


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

