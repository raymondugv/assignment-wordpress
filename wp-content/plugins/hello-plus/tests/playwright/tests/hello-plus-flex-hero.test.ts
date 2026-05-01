/* eslint-disable no-console */
import { expect } from '@playwright/test';
import { parallelTest as test } from '../parallelTest';
import WpAdminPage from '../pages/wp-admin-page';

let context;
let page;
let wpAdmin;
let editor;

test.beforeEach( async ( { browser, apiRequests }, testInfo ) => {
	// Arrange.
	context = await browser.newContext();
	page = await context.newPage();
	wpAdmin = new WpAdminPage( page, testInfo, apiRequests );
	editor = await wpAdmin.openNewPage();
	await editor.closeNavigatorIfOpen();
} );

test.afterEach( async () => {
	await context.close();
} );

test( 'Flex Hero widget can be added to the page', async () => {
	await editor.addWidget( 'flex-hero' );

	const previewFrame = editor.getPreviewFrame();
	const widget = previewFrame.locator( '.ehp-flex-hero' );
	await expect( widget ).toBeVisible();
} );

test( 'Flex Hero widget should have showcase layout preset class and works with controls', async () => {
	await editor.addWidget( 'flex-hero' );
	await editor.setWidgetTab( 'style' );
	await editor.openSection( 'style_content' );
	await editor.setColorControlValue( 'intro_color', '#1FB562' );
	await editor.setColorControlValue( 'heading_color', '#BBBBBB' );
	await editor.setColorControlValue( 'subheading_color', '#61CE70' );

	await editor.togglePreviewMode();

	const previewFrame = editor.getPreviewFrame();
	const widget = previewFrame.locator( '.ehp-flex-hero' );
	await expect( widget ).toHaveClass( /has-layout-preset-showcase/ );

	await expect.soft( widget ).toHaveScreenshot( 'flex-hero.png' );
} );
