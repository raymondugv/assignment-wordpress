import { parallelTest as test } from '../../../../parallelTest';
import { expect, type BrowserContext, type Page } from '@playwright/test';
import EditorPage from '../../../../pages/editor-page';
import { viewportSize } from '../../../../enums/viewport-sizes';

const WIDGET_CSS_CLASS = '.ehp-flex-footer';
const TEMPLATE_NAME = 'Footer';
const ADMIN_URL = '/wp-admin/edit.php?post_type=elementor_library&tabs_group=library&elementor_library_type=ehp-footer';
const EDIT_BUTTON_TEXT = 'Edit with Elementor';

const CONTROL_CONDITIONS = {
	group_1_business_details_subheading: ( layoutPreset: string ) => 'info-hub' === layoutPreset,
	group_2_navigation_links_subheading: ( layoutPreset: string ) => 'info-hub' === layoutPreset,
	group_3_contact_links_subheading: ( layoutPreset: string ) => 'info-hub' === layoutPreset,
	group_4_social_links_subheading: ( layoutPreset: string ) => 'info-hub' === layoutPreset,
	subheading_tag: ( layoutPreset: string ) => 'info-hub' === layoutPreset,
	style_layout_columns: ( layoutPreset: string ) => 'info-hub' === layoutPreset,
	style_layout_align_center_mobile: ( layoutPreset: string ) => 'info-hub' === layoutPreset,
	style_layout_content_width: ( layoutPreset: string ) => 'quick-reference' === layoutPreset,
};

const CONTROL_VALUES = {
	layoutPreset: [ 'info-hub', 'quick-reference' ],
	subheadingTag: [ 'h4', 'h5' ],
	columns: [ '2', '3' ],
	gaps: [ '20', '40' ],
	contentWidth: [ '80', '90' ],
	subheadingColors: [ '#6D788D', '#8C8F94' ],
	descriptionColors: [ '#3C434A', '#515962' ],
	linkColors: [ '#61CE70', '#7A6AE6' ],
	linkHoverColors: [ '#4CAF50', '#5E35B1' ],
	iconSizes: [ '16', '20' ],
	backgroundColors: [ '#F6F7F8', '#E8F4FD' ],
	borderColors: [ '#D1D5DB', '#9CA3AF' ],
	copyrightColors: [ '#6B7280', '#9CA3AF' ],
	subheadingTexts: [ 'Subheading Alpha', 'Subheading Beta' ],
	descriptionTexts: [
		'Description Alpha - Helping your business stand out with thoughtful details that drive action.',
		'Description Beta - Creating meaningful connections through innovative design and strategic thinking.',
	],
	quickLinksTexts: [ 'Quick Links Alpha', 'Quick Links Beta' ],
	contactTexts: [ 'Contact Alpha', 'Contact Beta' ],
	followTexts: [ 'Follow Alpha', 'Follow Beta' ],
	copyrightTexts: [
		'Copyright Alpha - All rights reserved.',
		'Copyright Beta - All rights reserved.',
	],
	group2Types: [ 'navigation-links', 'contact-links' ],
	group3Types: [ 'contact-links', 'social-links' ],
	group4Types: [ 'social-links', 'navigation-links' ],
	switcherValues: [ 'yes', 'no' ],
	borderWidths: [ '1', '2' ],
	frontendUrls: [ '/', '/' ],
};

let globalContext: BrowserContext;
let globalPage: Page;
let globalEditor: any;

test.beforeAll( async ( { browser, storageState }, testInfo ) => {
	globalContext = await browser.newContext( { storageState } );
	globalPage = await globalContext.newPage();
	globalEditor = new EditorPage( globalPage, testInfo );
} );

test.afterAll( async () => {
	await globalContext?.close();
} );

async function runFooterConfigurationTest( loopIndex: number ) {
	if ( ! globalEditor ) {
		throw new Error( 'globalEditor is undefined - beforeAll hook may have failed' );
	}

	await globalEditor.page.goto( ADMIN_URL );
	await globalEditor.page.getByRole( 'link', { name: TEMPLATE_NAME } ).first().click();
	const elementorButton = globalEditor.page.getByRole( 'link', { name: EDIT_BUTTON_TEXT } );
	await expect( elementorButton ).toBeVisible();

	const elementorUrl = await elementorButton.getAttribute( 'href' );
	if ( elementorUrl ) {
		await globalEditor.page.goto( elementorUrl );
		await globalEditor.page.waitForURL( elementorUrl );
	}

	await globalEditor.waitForPanelToLoad();

	const layoutPreset = globalEditor.getControlValueByIndex( CONTROL_VALUES.layoutPreset, loopIndex );

	await globalEditor.setWidgetTab( 'content' );

	await globalEditor.openSection( 'section_layout' );
	await globalEditor.setPresetImageControlValue( 'layout_preset', layoutPreset );

	await globalEditor.openSection( 'section_business_details' );

	if ( CONTROL_CONDITIONS.group_1_business_details_subheading( layoutPreset ) ) {
		await globalEditor.setTextControlValue( 'group_1_business_details_subheading', globalEditor.getControlValueByIndex( CONTROL_VALUES.subheadingTexts, loopIndex ) );
	}
	await globalEditor.setTextareaControlValue( 'group_1_business_details_description', globalEditor.getControlValueByIndex( CONTROL_VALUES.descriptionTexts, loopIndex ) );

	await globalEditor.setSwitcherControlValue( 'group_2_switcher', globalEditor.getControlValueByIndex( CONTROL_VALUES.switcherValues, loopIndex ) );
	await globalEditor.setSelectControlValue( 'group_2_type', globalEditor.getControlValueByIndex( CONTROL_VALUES.group2Types, loopIndex ) );
	if ( CONTROL_CONDITIONS.group_2_navigation_links_subheading( layoutPreset ) ) {
		await globalEditor.setTextControlValue( 'group_2_navigation_links_subheading', globalEditor.getControlValueByIndex( CONTROL_VALUES.quickLinksTexts, loopIndex ) );
	}

	await globalEditor.setSwitcherControlValue( 'group_3_switcher', globalEditor.getControlValueByIndex( CONTROL_VALUES.switcherValues, loopIndex ) );
	await globalEditor.setSelectControlValue( 'group_3_type', globalEditor.getControlValueByIndex( CONTROL_VALUES.group3Types, loopIndex ) );
	if ( CONTROL_CONDITIONS.group_3_contact_links_subheading( layoutPreset ) ) {
		await globalEditor.setTextControlValue( 'group_3_contact_links_subheading', globalEditor.getControlValueByIndex( CONTROL_VALUES.contactTexts, loopIndex ) );
	}

	await globalEditor.setSwitcherControlValue( 'group_4_switcher', globalEditor.getControlValueByIndex( CONTROL_VALUES.switcherValues, loopIndex ) );
	await globalEditor.setSelectControlValue( 'group_4_type', globalEditor.getControlValueByIndex( CONTROL_VALUES.group4Types, loopIndex ) );
	if ( CONTROL_CONDITIONS.group_4_social_links_subheading( layoutPreset ) ) {
		await globalEditor.setTextControlValue( 'group_4_social_links_subheading', globalEditor.getControlValueByIndex( CONTROL_VALUES.followTexts, loopIndex ) );
	}

	if ( CONTROL_CONDITIONS.subheading_tag( layoutPreset ) ) {
		await globalEditor.setSelectControlValue( 'subheading_tag', globalEditor.getControlValueByIndex( CONTROL_VALUES.subheadingTag, loopIndex ) );
	}

	await globalEditor.openSection( 'section_copyright' );
	await globalEditor.setSwitcherControlValue( 'current_year_switcher', globalEditor.getControlValueByIndex( CONTROL_VALUES.switcherValues, loopIndex ) );
	await globalEditor.setTextControlValue( 'copyright_text', globalEditor.getControlValueByIndex( CONTROL_VALUES.copyrightTexts, loopIndex ) );

	await globalEditor.setWidgetTab( 'style' );

	await globalEditor.openSection( 'section_style_layout' );

    if ( CONTROL_CONDITIONS.style_layout_columns( layoutPreset ) ) {
		await globalEditor.setSelectControlValue( 'style_layout_columns', globalEditor.getControlValueByIndex( CONTROL_VALUES.columns, loopIndex ) );
	}

    if ( CONTROL_CONDITIONS.style_layout_align_center_mobile( layoutPreset ) ) {
		await globalEditor.setSwitcherControlValue( 'style_layout_align_center_mobile', globalEditor.getControlValueByIndex( CONTROL_VALUES.switcherValues, loopIndex ) );
	}

	if ( CONTROL_CONDITIONS.style_layout_content_width( layoutPreset ) ) {
		await globalEditor.setSliderControlValue( 'style_layout_content_width', globalEditor.getControlValueByIndex( CONTROL_VALUES.contentWidth, loopIndex ) );
	}

	await globalEditor.openSection( 'box_style_section' );
	await globalEditor.setSliderControlValue( 'style_box_gap', globalEditor.getControlValueByIndex( CONTROL_VALUES.gaps, loopIndex ) );
	await globalEditor.setSwitcherControlValue( 'style_box_border', globalEditor.getControlValueByIndex( CONTROL_VALUES.switcherValues, loopIndex ) );
	await globalEditor.setSliderControlValue( 'style_box_border_width', globalEditor.getControlValueByIndex( CONTROL_VALUES.borderWidths, loopIndex ) );

	await globalEditor.publishPage();

	await globalEditor.page.goto( globalEditor.getControlValueByIndex( CONTROL_VALUES.frontendUrls, loopIndex ) );

	const frontendWidget = globalEditor.page.locator( WIDGET_CSS_CLASS ).first();
	await expect( frontendWidget ).toBeVisible();

	await expect.soft( frontendWidget ).toHaveScreenshot( `footer-config-${ loopIndex + 1 }-frontend.png`, { animations: 'disabled', caret: 'hide' } );

	await globalEditor.page.setViewportSize( viewportSize.tablet );
	await globalEditor.stabilizeForScreenshot( globalEditor.page, globalEditor );
	await expect.soft( frontendWidget ).toHaveScreenshot( `footer-config-${ loopIndex + 1 }-frontend-tablet.png`, { animations: 'disabled', caret: 'hide' } );

	await globalEditor.page.setViewportSize( viewportSize.mobile );
	await globalEditor.stabilizeForScreenshot( globalEditor.page, globalEditor );
	await expect.soft( frontendWidget ).toHaveScreenshot( `footer-config-${ loopIndex + 1 }-frontend-mobile.png`, { animations: 'disabled', caret: 'hide' } );

	await globalEditor.page.setViewportSize( viewportSize.desktop );
}

test.describe.serial( 'Hello Plus Footer', () => {
	test( 'Footer randomized configuration test 1', async () => {
		await runFooterConfigurationTest( 0 );
	} );

	test( 'Footer randomized configuration test 2', async () => {
		await runFooterConfigurationTest( 1 );
	} );
} );
