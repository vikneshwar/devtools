import { Page, test } from "@playwright/test";

import { toggleExpandable } from "replay-next/playwright/tests/utils/inspector";

import { filterByText, toggleProtocolMessage, toggleProtocolMessages } from "./utils/console";
import { getTestUrl, takeScreenshot, waitFor } from "./utils/general";
import testSetup from "./utils/testSetup";

testSetup("bc6df6be-8305-4e1e-9eda-c1da63ef023d");

async function inspectAndTakeScreenshotOf(page: Page, partialText: string, screenshotName: string) {
  const messageItem = await page
    .locator("[data-test-name=Message]", { hasText: partialText })
    .first();

  const keyValue = messageItem.locator("[data-test-name=Expandable]").first();
  await toggleExpandable(page, {
    expanded: true,
    expandableLocator: keyValue,
  });

  await takeScreenshot(page, keyValue, screenshotName);
}

async function inspectGetter(page: Page, partialText: string) {
  const messageItems = await page.locator("[data-test-name=Message]", { hasText: partialText });

  const getter = await messageItems.locator('[data-test-name="GetterRenderer"]', {
    hasText: partialText,
  });
  await takeScreenshot(page, getter, `${partialText}-getter-before-inspection`);
  const invokeGetterButton = getter.locator('[data-test-name="InvokeGetterButton"]');
  await invokeGetterButton.click();
  await takeScreenshot(page, getter, `${partialText}-getter-after-inspection`);
}

async function takeScreenshotOfMessage(page: Page, partialText: string, screenshotName: string) {
  const messageItem = await page
    .locator("[data-test-name=Message]", { hasText: partialText })
    .first();

  await takeScreenshot(page, messageItem, screenshotName);
}

async function takeScreenshotOfMessages(page: Page, screenshotName: string) {
  const messageItem = await page.locator("[data-test-name=Messages]").first();

  await takeScreenshot(page, messageItem, screenshotName);
}

test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(5000);

  await page.goto(getTestUrl("console"));

  await toggleProtocolMessages(page, false);
  await toggleProtocolMessage(page, "logs", true);
});

test("should render simple values", async ({ page }) => {
  await takeScreenshotOfMessage(page, "specialNull", "render-null");
  await takeScreenshotOfMessage(page, "specialUndefined", "render-undefined");

  await takeScreenshotOfMessage(page, "string", "render-string");

  await takeScreenshotOfMessage(page, "booleanFalse", "render-false");
  await takeScreenshotOfMessage(page, "booleanTrue", "render-true");

  await takeScreenshotOfMessage(page, "number", "render-number");
  await takeScreenshotOfMessage(page, "NaN", "render-nan");
  await takeScreenshotOfMessage(page, "infinity", "render-infinity");
  await takeScreenshotOfMessage(page, "bigInt", "render-bigInt");

  await takeScreenshotOfMessage(page, "symbol", "render-symbol");
});

test("should render and inspect arrays", async ({ page }) => {
  await filterByText(page, "array");

  await takeScreenshotOfMessages(page, "render-arrays");
  await inspectAndTakeScreenshotOf(page, "arrayLength", "render-and-inspect-array");
  await inspectAndTakeScreenshotOf(page, "bigUint64Array", "render-and-inspect-big-uint-64-array");
});

test("should render dates", async ({ page }) => {
  await filterByText(page, "date");

  await takeScreenshotOfMessages(page, "render-dates");
});

test("should render errors", async ({ page }) => {
  await filterByText(page, "error");

  await takeScreenshotOfMessages(page, "render-errors");
});

test("should render and inspect functions", async ({ page }) => {
  await filterByText(page, "function");

  await takeScreenshotOfMessages(page, "render-functions");
  await inspectAndTakeScreenshotOf(page, "regularFunction", "render-and-inspect-function");
});

test("should render and inspect HTML elements", async ({ page }) => {
  await filterByText(page, "filter_html");

  await takeScreenshotOfMessages(page, "render-html-elements-and-texts");
  await inspectAndTakeScreenshotOf(
    page,
    "htmlElementWithChildren",
    "render-and-inspect-html-element"
  );
});

test("should render and inspect maps", async ({ page }) => {
  await filterByText(page, "map");

  await inspectAndTakeScreenshotOf(page, "emptyMap", "render-empty-map");
  await inspectAndTakeScreenshotOf(page, "simpleMap", "render-and-inspect-map");
  await inspectAndTakeScreenshotOf(
    page,
    "mapWithFalsyKeys",
    "render-and-inspect-map-with-falsy-keys"
  );
  await inspectAndTakeScreenshotOf(
    page,
    "mapWithComplexKeys",
    "render-and-inspect-map-with-complex-keys"
  );
});

test("should render and inspect regular expressions", async ({ page }) => {
  await filterByText(page, "regex");

  await takeScreenshotOfMessages(page, "render-regular-expressions");
  await inspectAndTakeScreenshotOf(page, "regex", "render-and-inspect-regex");
});

test("should render and inspect sets", async ({ page }) => {
  await filterByText(page, "set");

  await takeScreenshotOfMessages(page, "rendered-sets");
  await inspectAndTakeScreenshotOf(page, "simpleSet", "render-and-inspect-set");
});

test("should render and inspect objects", async ({ page }) => {
  await filterByText(page, "filter_object");

  await takeScreenshotOfMessages(page, "rendered-objects");
  await inspectAndTakeScreenshotOf(page, "objectSimple", "render-and-inspect-object");
});

test("should render getters and setters correctly", async ({ page }) => {
  await filterByText(page, "filter_objectWithGettersAndSetters");

  await inspectAndTakeScreenshotOf(
    page,
    "objectWithGettersAndSetters",
    "render-object-with-getters-and-setters"
  );

  await inspectGetter(page, "string");
  await inspectGetter(page, "null");
  await inspectGetter(page, "undefined");
  await inspectGetter(page, "object");
  await inspectGetter(page, "array");

  // Further inspect object and array
  const objectRow = await page
    .locator('[data-test-name="ExpandablePreview"]', { hasText: "objectGetter" })
    .first();
  await objectRow.click();
  await takeScreenshot(page, objectRow, "inspect-getter-nested-object");

  const arrayRow = await page
    .locator('[data-test-name="ExpandablePreview"]', { hasText: "arrayGetter" })
    .first();
  await arrayRow.click();
  await takeScreenshot(page, arrayRow, "inspect-getter-nested-array");
});

test("should properly bucket properties for an overflowing array", async ({ page }) => {
  await filterByText(page, "overflowingArray");

  await inspectAndTakeScreenshotOf(page, "overflowingArray", "overflowing-array-expanded");

  await toggleExpandable(page, {
    partialText: "[0 … 99]",
    expanded: true,
  });
  await takeScreenshotOfMessages(page, "overflowing-array-first-bucket-expanded");

  await toggleExpandable(page, {
    partialText: "[0 … 99]",
    expanded: false,
  });
  await toggleExpandable(page, {
    partialText: "[100 … 105]",
    expanded: true,
  });
  await takeScreenshotOfMessages(page, "overflowing-array-second-bucket-expanded");
});

test("should render and inspect a Promise", async ({ page }) => {
  await inspectAndTakeScreenshotOf(page, "promise", "render-promise");
});

test("should render and inspect a Proxy", async ({ page }) => {
  await inspectAndTakeScreenshotOf(page, "proxy", "render-proxy");
});
