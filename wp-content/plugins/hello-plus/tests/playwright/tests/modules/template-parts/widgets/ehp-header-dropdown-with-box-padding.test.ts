import { parallelTest as test } from '../../../../parallelTest';
import { expect, type BrowserContext, type Page } from '@playwright/test';
import WpAdminPage from '../../../../pages/wp-admin-page';
import { viewportSize } from '../../../../enums/viewport-sizes';
import _path from 'path';

let globalContext: BrowserContext;
let globalPage: Page;
let globalWpAdmin: any;
let globalEditor: any;

test.beforeAll( async ( { browser, apiRequests, storageState }, testInfo ) => {
	globalContext = await browser.newContext( { storageState } );
	globalPage = await globalContext.newPage();
	globalWpAdmin = new WpAdminPage( globalPage, testInfo, apiRequests );
	await globalWpAdmin.setExperiments( { pages_panel: true } );
	await globalWpAdmin.hideAdminBar();
	globalEditor = await globalWpAdmin.openNewPage();
	await globalEditor.closeNavigatorIfOpen();
} );

test.afterAll( async () => {
	await globalWpAdmin.showAdminBar();
	await globalContext?.close();
} );

test.describe( 'Hello Plus Header Dropdown Box Padding styling', () => {
	test( 'Box padding styling', async () => {
		if ( ! globalEditor || ! globalWpAdmin ) {
			throw new Error( 'Global variables are undefined - beforeAll hook may have failed to initialize shared context' );
		}

		await test.step( 'Create a new menu with dropdown items', async () => {
			await globalWpAdmin.gotoDashboard();
			await globalWpAdmin.createNewMenu( 'Dropdown Test Menu' );
		} );

		await test.step( 'Create a new header with the dropdown menu', async () => {
			const filePath = _path.resolve( __dirname, `../../../../templates/hello-plus-header-template.json` );
			await globalWpAdmin.gotoDashboard();
			await globalEditor.importTemplateUI( filePath );
			await globalWpAdmin.closeAnnouncementsIfVisible();
			await globalEditor.waitForPanelToLoad();
			const previewFrame = globalEditor.getPreviewFrame();
			const headerWidget = previewFrame.locator( '[data-widget_type="ehp-header.default"]' ).first();
			await headerWidget.click( { position: { x: 50, y: 50 } } );
			await globalEditor.waitForPanelToLoad();
		} );

		await test.step( 'Test box padding and cta styling', async () => {
			await globalEditor.setWidgetTab( 'style' );
			await globalEditor.page.waitForTimeout( 1000 );
			await globalEditor.closeSection( 'section_site_identity' );
			await globalEditor.page.waitForTimeout( 1000 );
			await globalEditor.openSection( 'style_box_section' );
			await globalEditor.page.waitForTimeout( 1000 );
			await globalEditor.page.locator( '.elementor-control-box_padding > .elementor-control-content > .elementor-control-field > .e-units-wrapper > .e-units-switcher' ).click();
			await globalEditor.page.locator( '.elementor-control-box_padding > .elementor-control-content > .elementor-control-field > .e-units-wrapper > .e-units-choices > label:nth-child(4)' ).click();
			await globalEditor.setDimensionsValue( 'box_padding', '20' );
			await globalEditor.setBackgroundColorControlValue( 'background_background', 'background_color', '#616161' );

			await globalEditor.openSection( 'style_cta' );
			await globalEditor.setSelectControlValue( 'cta_responsive_width', 'stretch' );

			await globalEditor.page.getByRole( 'button', { name: 'Publish' } ).click();
			await globalEditor.page.waitForTimeout( 200 );
			await globalEditor.page.goto( '/' );

			const header = globalEditor.page.locator( '.ehp-header' ).first();
			await header.waitFor();
			await expect( header ).toHaveScreenshot( 'header-box-padding-width-stretch-desktop.png' );

			await globalEditor.page.addStyleTag( {
				content: 'body { min-height: 480px !important; } main, footer, [data-elementor-type="ehp-footer"] { opacity: 0 !important; }',
			} );

			await globalEditor.page.setViewportSize( viewportSize.mobile );
			await expect.soft( header ).toHaveScreenshot( 'header-dropdown-with-box-padding-width-stretch-closed.png' );

			await globalEditor.page.locator( '.ehp-header__button-toggle' ).click();
			await globalEditor.page.locator( '.ehp-header__navigation[aria-hidden="false"]' ).waitFor();
			await globalEditor.page.waitForTimeout( 500 );
			await expect.soft( globalEditor.page ).toHaveScreenshot( 'header-dropdown-with-box-padding-width-stretch.png' );
		} );
	} );
} );
