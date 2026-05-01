import { parallelTest as test } from '../../../../parallelTest';
import { expect, type BrowserContext, type Page } from '@playwright/test';
import WpAdminPage from '../../../../pages/wp-admin-page';
import _path from 'path';
import { viewportSize } from '../../../../enums/viewport-sizes';

const WIDGET_CSS_CLASS = '.ehp-header';

const CONTROL_VALUES = {
	layoutPreset: [ 'connect', 'identity', 'navigate' ],
	menuItemSpacing: [ '16', '32', '48' ],
	submenuLayout: [ 'horizontal', 'vertical' ],
	alternateBackgroundColors: [ '#E8F4FD', '#FFF3E0', '#F6F7F8' ],
};

let globalContext: BrowserContext;
let globalPage: Page;
let globalWpAdmin: any;
let globalEditor: any;

test.beforeAll( async ( { browser, apiRequests, storageState }, testInfo ) => {
	globalContext = await browser.newContext( { storageState } );
	globalPage = await globalContext.newPage();
	globalWpAdmin = new WpAdminPage( globalPage, testInfo, apiRequests );
	globalEditor = await globalWpAdmin.openNewPage();
	await globalEditor.closeNavigatorIfOpen();
} );

test.afterAll( async () => {
	await globalContext?.close();
} );

async function runHeaderConfigurationTest( loopIndex: number ) {
	if ( ! globalEditor ) {
		throw new Error( 'globalEditor is undefined - beforeAll hook may have failed' );
	}

	await globalEditor.page.goto( `/wp-admin/edit.php?post_type=elementor_library&tabs_group=library&elementor_library_type=ehp-header` );
	await globalEditor.page.getByRole( 'link', { name: 'Elementor Hello+ Header #9' } ).first().click();
	const elementorButton = globalEditor.page.getByRole( 'link', { name: 'Edit with Elementor' } );
	await expect( elementorButton ).toBeVisible();

	const elementorUrl = await elementorButton.getAttribute( 'href' );
	await elementorButton.click();
	if ( elementorUrl ) {
		await globalEditor.page.waitForURL( elementorUrl );
	}

	await globalEditor.waitForPanelToLoad();
	await globalEditor.setWidgetTab( 'content' );
	await globalEditor.setPresetImageControlValue(
		'layout_preset_select',
		globalEditor.getControlValueByIndex( CONTROL_VALUES.layoutPreset, loopIndex ),
	);

	await globalEditor.openSection( 'section_contact_buttons' );
	if ( 0 === loopIndex ) {
		await globalEditor.setSwitcherControlValue( 'contact_buttons_show_connect', 'yes' );
	} else {
		await globalEditor.setSwitcherControlValue( 'contact_buttons_show', 'yes' );
	}

	await globalEditor.setWidgetTab( 'style' );

	await globalEditor.openSection( 'section_navigation_style' );
	await globalEditor.setSliderControlValue( 'menu_item_spacing', globalEditor.getControlValueByIndex( CONTROL_VALUES.menuItemSpacing, loopIndex ) );
	await globalEditor.setSelectControlValue( 'style_submenu_layout', globalEditor.getControlValueByIndex( CONTROL_VALUES.submenuLayout, loopIndex ) );
	await globalEditor.closeSection( 'section_navigation_style' );

	await globalEditor.openSection( 'style_box_section' );
	await globalEditor.setBackgroundColorControlValue( 'background_background', 'background_color', globalEditor.getControlValueByIndex( CONTROL_VALUES.alternateBackgroundColors, loopIndex ) );
	await globalEditor.closeSection( 'style_box_section' );

	await globalEditor.publishPage();
	await globalEditor.page.goto( '/' );

	const frontendWidget = globalEditor.page.locator( WIDGET_CSS_CLASS );
	await expect( frontendWidget ).toBeVisible();
	await expect.soft( frontendWidget ).toHaveScreenshot( `header-config-${ loopIndex + 1 }-frontend.png`, { animations: 'disabled', caret: 'hide' } );
	await globalEditor.page.setViewportSize( viewportSize.tablet );
	await globalEditor.stabilizeForScreenshot( globalEditor.page, globalEditor );
	await expect.soft( frontendWidget ).toHaveScreenshot( `header-config-${ loopIndex + 1 }-frontend-tablet.png`, { animations: 'disabled', caret: 'hide' } );
	await globalEditor.page.setViewportSize( viewportSize.mobile );
	await globalEditor.stabilizeForScreenshot( globalEditor.page, globalEditor );
	await expect.soft( frontendWidget ).toHaveScreenshot( `header-config-${ loopIndex + 1 }-frontend-mobile.png`, { animations: 'disabled', caret: 'hide' } );
	await globalEditor.page.setViewportSize( viewportSize.desktop );
}

test.describe.serial( 'Hello Plus Header', () => {
	test( 'Assert that the dropdown button does not inherit the background color from the theme settings', async () => {
		if ( ! globalEditor || ! globalWpAdmin ) {
			throw new Error( 'Global variables are undefined - beforeAll hook may have failed to initialize shared context' );
		}

		await test.step( 'Update Hello Commerce style settings', async () => {
			await globalEditor.openSiteSettings( 'theme-style-buttons' );

			await globalEditor.setBackgroundColorControlValue( 'button_background_color_background', 'button_background_color', '#3bc7b6' );

			await globalEditor.saveSiteSettingsWithTopBar( false );
		} );

		await test.step( 'Create a new menu', async () => {
			await globalWpAdmin.gotoDashboard();
			await globalWpAdmin.createNewMenu( 'Dropdown menu' );
		} );

		await test.step( 'Create a new header', async () => {
			const filePath = _path.resolve( __dirname, `../../../../templates/hello-plus-header-template.json` );
			await globalWpAdmin.gotoDashboard();
			await globalEditor.importTemplateUI( filePath );
			await globalWpAdmin.closeAnnouncementsIfVisible();
			await globalEditor.page.getByRole( 'button', { name: 'Publish' } ).click();
			await globalEditor.page.waitForTimeout( 200 );
			await globalEditor.page.goto( '/' );
			const parentBtn = globalEditor.page.getByRole( 'button', { name: 'Parent menu item' } );
			await globalEditor.stabilizeForScreenshot( globalEditor.page, globalEditor );
			await expect( parentBtn ).toBeVisible();
			await expect.soft( parentBtn ).toHaveScreenshot( 'header-parent-menu-item.png', { animations: 'disabled', caret: 'hide' } );
		} );
	} );

	test( 'Header randomized configuration test', async () => {
		if ( ! globalEditor ) {
			throw new Error( 'globalEditor is undefined - beforeAll hook may have failed to initialize shared context' );
		}

		await runHeaderConfigurationTest( 0 );
		await runHeaderConfigurationTest( 1 );
		await runHeaderConfigurationTest( 2 );
	} );

	test( 'Header sticky behavior (advanced tab) test', async () => {
		const behaviors = [ 'scroll-up', 'always', 'none' ];

		for ( const behavior of behaviors ) {
			// Open the header template and set sticky behavior in Advanced tab.
			await globalEditor.page.goto( `/wp-admin/edit.php?post_type=elementor_library&tabs_group=library&elementor_library_type=ehp-header` );
			await globalEditor.page.getByRole( 'link', { name: 'Elementor Hello+ Header #9' } ).first().click();
			const elementorButton = globalEditor.page.getByRole( 'link', { name: 'Edit with Elementor' } );
			await expect( elementorButton ).toBeVisible();

			const elementorUrl = await elementorButton.getAttribute( 'href' );
			await elementorButton.click();
			if ( elementorUrl ) {
				await globalEditor.page.waitForURL( elementorUrl );
			}

			await globalEditor.waitForPanelToLoad();
			await globalEditor.setWidgetTab( 'advanced' );
			await globalEditor.openSection( 'advanced_behavior_section' );
			await globalEditor.setSelectControlValue( 'behavior_onscroll_select', behavior );
			await globalEditor.publishPage();

			// Create a new page with enough content to allow scrolling, then publish and view it.
			const pageEditor = await globalWpAdmin.openNewPage();
			await pageEditor.closeNavigatorIfOpen();
			for ( let i = 0; i < 3; i++ ) {
				await pageEditor.addWidget( 'zigzag' );
			}
			await pageEditor.publishAndViewPage();

			await pageEditor.page.setViewportSize( viewportSize.desktop );
			const headerSelector = 'header.ehp-header';
			await expect( pageEditor.page.locator( headerSelector ) ).toBeVisible();

			await pageEditor.page.mouse.wheel( 0, 600 );
			await pageEditor.page.waitForTimeout( 800 );

			if ( 'always' === behavior ) {
				// Header should remain visible.
				expect.soft( await pageEditor.isItemInViewport( headerSelector ) ).toBeTruthy();
			} else if ( 'none' === behavior ) {
				// Header should scroll out of view.
				expect.soft( await pageEditor.isItemInViewport( headerSelector ) ).toBeFalsy();
			} else if ( 'scroll-up' === behavior ) {
				// On scroll down header hides, on scroll up it appears.
				expect.soft( await pageEditor.isItemInViewport( headerSelector ) ).toBeFalsy();
				await pageEditor.page.mouse.wheel( 0, -300 );
				await pageEditor.page.waitForTimeout( 800 );
				expect.soft( await pageEditor.isItemInViewport( headerSelector ) ).toBeTruthy();
			}
		}
	} );
} );
