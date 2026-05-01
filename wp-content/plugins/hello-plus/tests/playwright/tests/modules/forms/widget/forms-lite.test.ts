import { expect } from '@playwright/test';
import { parallelTest as test } from '../../../../parallelTest';
import WpAdminPage from '../../../../pages/wp-admin-page';
import { viewportSize } from '../../../../enums/viewport-sizes';

const WIDGET = {
    name: 'ehp-form',
    selector: '.ehp-form',
} as const;

const SELECTORS = {
    heading: '.ehp-form__heading',
    description: '.ehp-form__description',
    button: '.ehp-form__button',
    submitGroup: '.ehp-form__submit-group',
    fields: {
        name: 'input[name="form_fields[name]"]',
        email: 'input[name="form_fields[email]"]',
        message: 'textarea[name="form_fields[message]"]',
    },
    labels: {
        name: 'label[for*="form-field-name"]',
        email: 'label[for*="form-field-email"]',
    },
} as const;

const TEXT = {
    defaultHeading: 'Contact Us',
    defaultDescription:
        'Fill out the form below and we will contact you as soon as possible',
    customHeading: 'Get In Touch',
    customDescription:
        'We would love to hear from you. Send us a message and we will respond as soon as possible.',
    buttonText: 'Submit Form',
} as const;

const ATTRS = {
    buttonId: 'custom-submit-btn',
} as const;

const COLORS = {
    red: '#FF0000',
    blue: '#0000FF',
    gray333: '#333333',
    gray444: '#444444',
    white: '#FFFFFF',
    grayCCC: '#CCCCCC',
} as const;

const VALUES = {
    headingTag: 'h1',
    buttonWidth: '50',
    gap24: '24',
    inputSizeLg: 'lg',
} as const;

const SCREENSHOTS = {
    styleDesktop: 'forms-lite-style-editor.png',
    styleTablet: 'forms-lite-style-editor-tablet.png',
    styleMobile: 'forms-lite-style-editor-mobile.png',
} as const;

const SECTIONS = {
    text: 'section_text',
    formFields: 'section_form_fields',
    buttons: 'section_buttons',
    textStyle: 'section_text_style',
    formStyle: 'section_form_style',
    fieldStyle: 'section_field_style',
    buttonStyle: 'section_button_style',
} as const;

const CONTROLS = {
    textHeading: 'text_heading',
    textHeadingTag: 'text_heading_tag',
    textDescription: 'text_description',
    showLabels: 'show_labels',
    markRequired: 'mark_required',
    buttonText: 'button_text',
    buttonWidth: 'button_width',
    buttonCssId: 'button_css_id',
    headingColor: 'heading_color',
    descriptionColor: 'description_color',
    columnGap: 'column_gap',
    rowGap: 'row_gap',
    labelColor: 'label_color',
    inputSize: 'input_size',
    fieldTextColor: 'field_text_color',
    fieldBackgroundColor: 'field_background_color',
    fieldBorderSwitcher: 'field_border_switcher',
    fieldBorderColor: 'field_border_color',
    buttonType: 'button_type',
    buttonTextColor: 'button_text_color',
} as const;

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

test( 'Forms Lite widget can be added to the page', async () => {
    await editor.addWidget( WIDGET.name );
    const previewFrame = editor.getPreviewFrame();
    const widget = previewFrame.locator( WIDGET.selector );
	await expect( widget ).toBeVisible();
} );

test( 'Forms Lite widget has default form fields', async () => {
    await editor.addWidget( WIDGET.name );

	const previewFrame = editor.getPreviewFrame();

    const nameField = previewFrame.locator( SELECTORS.fields.name );
    const emailField = previewFrame.locator( SELECTORS.fields.email );
    const messageField = previewFrame.locator( SELECTORS.fields.message );
    const submitButton = previewFrame.locator( SELECTORS.button );

	await expect( nameField ).toBeVisible();
	await expect( emailField ).toBeVisible();
	await expect( messageField ).toBeVisible();
	await expect( submitButton ).toBeVisible();

    const heading = previewFrame.locator( SELECTORS.heading );
    const description = previewFrame.locator( SELECTORS.description );

    await expect( heading ).toContainText( TEXT.defaultHeading );
    await expect( description ).toContainText( TEXT.defaultDescription );
} );

test( 'Forms Lite widget text content can be customized', async () => {
    await editor.addWidget( WIDGET.name );

    await editor.openSection( SECTIONS.text );
    await editor.setTextareaControlValue( CONTROLS.textHeading, TEXT.customHeading );
    await editor.setSelectControlValue( CONTROLS.textHeadingTag, VALUES.headingTag );

    await editor.setTextareaControlValue( CONTROLS.textDescription, TEXT.customDescription );

    await editor.publishAndViewPage();
    const heading = page.locator( SELECTORS.heading );
    const description = page.locator( SELECTORS.description );

    await expect( heading ).toContainText( TEXT.customHeading );
	const headingTagName = await heading.evaluate( ( el ) => el.tagName.toLowerCase() );
    expect( headingTagName ).toBe( VALUES.headingTag );
    await expect( description ).toContainText( TEXT.customDescription );
} );

test( 'Forms Lite widget form fields can be customized', async () => {
    await editor.addWidget( WIDGET.name );

    await editor.openSection( SECTIONS.formFields );

    await editor.setSwitcherControlValue( CONTROLS.showLabels, true );
    await editor.setSwitcherControlValue( CONTROLS.markRequired, true );

	const previewFrame = editor.getPreviewFrame();

    const nameLabel = previewFrame.locator( SELECTORS.labels.name );
    const emailLabel = previewFrame.locator( SELECTORS.labels.email );

	await expect( nameLabel ).toBeVisible();
	await expect( emailLabel ).toBeVisible();
} );

test( 'Forms Lite widget button can be customized', async () => {
    await editor.addWidget( WIDGET.name );

    await editor.openSection( SECTIONS.buttons );

    await editor.setTextControlValue( CONTROLS.buttonText, TEXT.buttonText );

    await editor.setSelectControlValue( CONTROLS.buttonWidth, VALUES.buttonWidth );

    await editor.setTextControlValue( CONTROLS.buttonCssId, ATTRS.buttonId );

	const previewFrame = editor.getPreviewFrame();
    const button = previewFrame.locator( SELECTORS.button );
    const submitGroup = previewFrame.locator( SELECTORS.submitGroup );

    await expect( button ).toContainText( TEXT.buttonText );
    await expect( button ).toHaveAttribute( 'id', ATTRS.buttonId );
    await expect( submitGroup ).toHaveClass( new RegExp( `has-width-${ VALUES.buttonWidth }` ) );
} );

test( 'Forms Lite widget style controls work correctly', async () => {
    await editor.addWidget( WIDGET.name );
	await editor.setWidgetTab( 'style' );

    await editor.openSection( SECTIONS.textStyle );
    await editor.setColorControlValue( CONTROLS.headingColor, COLORS.red );
    await editor.setColorControlValue( CONTROLS.descriptionColor, COLORS.blue );

    await editor.openSection( SECTIONS.formStyle );
    await editor.setSliderControlValue( CONTROLS.columnGap, VALUES.gap24 );
    await editor.setSliderControlValue( CONTROLS.rowGap, VALUES.gap24 );
    await editor.setColorControlValue( CONTROLS.labelColor, COLORS.gray333 );

    await editor.openSection( SECTIONS.fieldStyle );
    await editor.setSelectControlValue( CONTROLS.inputSize, VALUES.inputSizeLg );
    await editor.setColorControlValue( CONTROLS.fieldTextColor, COLORS.gray444 );
    await editor.setColorControlValue( CONTROLS.fieldBackgroundColor, COLORS.white );
	await editor.setSwitcherControlValue( 'field_border_switcher', true );
    await editor.setColorControlValue( CONTROLS.fieldBorderColor, COLORS.grayCCC );

    await editor.openSection( SECTIONS.buttonStyle );
    await editor.setSelectControlValue( CONTROLS.buttonType, 'button' );
    await editor.setColorControlValue( CONTROLS.buttonTextColor, COLORS.white );

	await editor.publishAndViewPage();
    const frontendWidget = page.locator( WIDGET.selector );
	await expect( frontendWidget ).toBeVisible();
    await expect.soft( frontendWidget ).toHaveScreenshot( SCREENSHOTS.styleDesktop );
	await page.setViewportSize( viewportSize.tablet );
    await expect.soft( frontendWidget ).toHaveScreenshot( SCREENSHOTS.styleTablet );
	await page.setViewportSize( viewportSize.mobile );
    await expect.soft( frontendWidget ).toHaveScreenshot( SCREENSHOTS.styleMobile );
} );

