import { expect } from '@playwright/test';
import { parallelTest as test } from '../../../../parallelTest';
import WpAdminPage from '../../../../pages/wp-admin-page';
import { viewportSize } from '../../../../enums/viewport-sizes';

const WIDGET_CSS_CLASS = '.ehp-zigzag';

const CONTROL_VALUES = {
	direction: [ 'eicon-order-start', 'eicon-order-end' ],
	alignment: [ 'eicon-align-start-v', 'eicon-align-center-v', 'eicon-align-end-v' ],
	background: [ 'eicon-paint-brush', 'eicon-barcode' ],
	titleTags: [ 'h2', 'h4', 'div' ],
	imageWidth: [ '50%', '40%', '30%' ],
	imagePosition: [ 'center center', 'top left', 'bottom right' ],
	imageShape: [ 'sharp', 'rounded', 'round' ],
	iconSpacing: [ '5', '15', '25' ],
	columnGap: [ '50', '150' ],
	rowGap: [ '60', '180' ],
	contentWidth: [ '800', '400', '1600' ],
	switcherControls: [
		'has_alternate_text_styles',
		'has_alternate_button_styles',
		'show_alternate_background',
		'has_alternate_padding',
	],
	paddingValues: [ '10', '25', '40' ],
	backgroundColors: [ '#FF5722', '#2196F3', '#4CAF50' ],
	alternateBackgroundColors: [ '#2196F3', '#4CAF50', '#FF5722' ],
};

let context;
let page;
let wpAdmin;
let editor;

test.beforeEach( async ( { browser, apiRequests }, testInfo ) => {
	context = await browser.newContext();
	page = await context.newPage();
	wpAdmin = new WpAdminPage( page, testInfo, apiRequests );
	editor = await wpAdmin.openNewPage();
	await editor.closeNavigatorIfOpen();
} );

test.afterEach( async () => {
	await context.close();
} );

test( 'Zigzag widget can be added to the page', async () => {
	await editor.addWidget( 'zigzag' );

	const previewFrame = editor.getPreviewFrame();
	const widget = previewFrame.locator( WIDGET_CSS_CLASS );
	await expect( widget ).toBeVisible();
	await expect.soft( widget ).toHaveScreenshot( 'zigzag-default-editor.png' );
	await editor.publishAndViewPage();

	const frontendWidget = page.locator( WIDGET_CSS_CLASS );
	await expect( frontendWidget ).toBeVisible();
	await expect.soft( frontendWidget ).toHaveScreenshot( 'zigzag-default-frontend.png' );
	await page.setViewportSize( viewportSize.tablet );
	await expect.soft( frontendWidget ).toHaveScreenshot( 'zigzag-default-frontend-tablet.png' );
	await page.setViewportSize( viewportSize.mobile );
	await expect.soft( frontendWidget ).toHaveScreenshot( 'zigzag-default-frontend-mobile.png' );
} );

for ( let loopIndex = 0; loopIndex < 3; loopIndex++ ) {
	test( `Zigzag randomized configuration test ${ loopIndex + 1 }`, async () => {
		await editor.addWidget( 'zigzag' );
		await editor.waitForPanelToLoad();

		const previewFrame = editor.getPreviewFrame();
		const editorWidget = previewFrame.locator( WIDGET_CSS_CLASS );
		await expect( editorWidget ).toBeVisible();

		await editor.setWidgetTab( 'content' );
		await editor.setSelectControlValue( 'zigzag_title_tag', editor.getControlValueByIndex( CONTROL_VALUES.titleTags, loopIndex ) );

		await editor.setWidgetTab( 'style' );
		await editor.setChooseControlValue( 'first_zigzag_direction', editor.getControlValueByIndex( CONTROL_VALUES.direction, loopIndex ) );
		await editor.setChooseControlValue( 'content_alignment', editor.getControlValueByIndex( CONTROL_VALUES.alignment, loopIndex ) );
		await editor.setSliderControlValue( 'content_width', editor.getControlValueByIndex( CONTROL_VALUES.contentWidth, loopIndex ) );

		await editor.openSection( 'style_image_section' );
		await editor.setSelectControlValue( 'image_width', editor.getControlValueByIndex( CONTROL_VALUES.imageWidth, loopIndex ) );
		await editor.setSelectControlValue( 'image_position', editor.getControlValueByIndex( CONTROL_VALUES.imagePosition, loopIndex ) );
		await editor.setSelectControlValue( 'image_shape', editor.getControlValueByIndex( CONTROL_VALUES.imageShape, loopIndex ) );
		await editor.setSwitcherControlValue( 'show_image_border', 0 === loopIndex % 2 );
		await editor.closeSection( 'style_image_section' );

		await editor.openSection( 'style_cta_section' );
		await editor.setSliderControlValue( 'primary_button_icon_spacing', editor.getControlValueByIndex( CONTROL_VALUES.iconSpacing, loopIndex ) );
		await editor.closeSection( 'style_cta_section' );

		await editor.openSection( 'box_style_section' );
		await editor.setBackgroundColorControlValue( 'background_background', 'background_color', editor.getControlValueByIndex( CONTROL_VALUES.backgroundColors, loopIndex ) );

		await editor.setSliderControlValue( 'column_gap', editor.getControlValueByIndex( CONTROL_VALUES.columnGap, loopIndex ) );
		await editor.setSliderControlValue( 'row_gap', editor.getControlValueByIndex( CONTROL_VALUES.rowGap, loopIndex ) );
		await editor.closeSection( 'box_style_section' );

		await editor.openSection( 'style_alternate_section' );
		await editor.setSwitcherControlValue( editor.getControlValueByIndex( CONTROL_VALUES.switcherControls, loopIndex ), true );

		if ( loopIndex >= 1 ) {
			await editor.setSwitcherControlValue( 'has_alternate_padding', true );
			await page.waitForTimeout( 500 );

			const paddingControl = page.locator( '.elementor-control-alternate_padding_horizontal' );
			const isPaddingVisible = await paddingControl.isVisible() && ! await paddingControl.getAttribute( 'class' ).then( ( classes ) => classes?.includes( 'elementor-hidden-control' ) );
			if ( isPaddingVisible ) {
				await editor.setSliderControlValue( 'alternate_padding_horizontal', editor.getControlValueByIndex( CONTROL_VALUES.paddingValues, loopIndex ) );
			}
		}

		if ( loopIndex >= 2 ) {
			await editor.setSwitcherControlValue( 'show_alternate_background', true );
			await page.waitForTimeout( 500 );

			const bgControl = page.locator( '.elementor-control-alternate_background_background' );
			const isBgVisible = await bgControl.isVisible() && ! await bgControl.getAttribute( 'class' ).then( ( classes ) => classes?.includes( 'elementor-hidden-control' ) );
			if ( isBgVisible ) {
				await page.waitForTimeout( 500 );
				await editor.setBackgroundColorControlValue( 'alternate_background_background', 'alternate_background_color', editor.getControlValueByIndex( CONTROL_VALUES.alternateBackgroundColors, loopIndex ) );
			}
		}

		await editor.closeSection( 'style_alternate_section' );

		await expect.soft( editorWidget ).toHaveScreenshot( `zigzag-config-${ loopIndex + 1 }-editor.png` );

		await editor.publishAndViewPage();

		const frontendWidget = page.locator( WIDGET_CSS_CLASS );
		await expect( frontendWidget ).toBeVisible();
		await expect.soft( frontendWidget ).toHaveScreenshot( `zigzag-config-${ loopIndex + 1 }-frontend.png` );
		await page.setViewportSize( viewportSize.tablet );
		await expect.soft( frontendWidget ).toHaveScreenshot( `zigzag-config-${ loopIndex + 1 }-frontend-tablet.png` );
		await page.setViewportSize( viewportSize.mobile );
		await expect.soft( frontendWidget ).toHaveScreenshot( `zigzag-config-${ loopIndex + 1 }-frontend-mobile.png` );
	} );
}
