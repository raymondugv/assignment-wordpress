import { parallelTest as test } from '../../../../parallelTest';
import { expect, type BrowserContext, type Page } from '@playwright/test';
import WpAdminPage from '../../../../pages/wp-admin-page';
import _path from 'path';

const WIDGET_CSS_CLASS = '.ehp-header';
const DROPDOWN_TOGGLE_SELECTOR = '.ehp-header__dropdown-toggle';
const DROPDOWN_MENU_SELECTOR = '.ehp-header__dropdown';
const MENU_ITEM_WITH_CHILDREN_SELECTOR = '.menu-item-has-children';

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

test.describe( 'Hello Plus Header Dropdown Hover Behavior', () => {
	test( 'Dropdown menu opens on hover and closes on mouse leave', async () => {
		if ( ! globalEditor || ! globalWpAdmin ) {
			throw new Error( 'Global variables are undefined - beforeAll hook may have failed to initialize shared context' );
		}

		await test.step( 'Create a new menu with dropdown items', async () => {
			await globalWpAdmin.gotoDashboard();
			await globalWpAdmin.createNewMenu( 'Dropdown Hover Test Menu' );
		} );

		await test.step( 'Create a new header with the dropdown menu', async () => {
			const filePath = _path.resolve( __dirname, `../../../../templates/hello-plus-header-template.json` );
			await globalWpAdmin.gotoDashboard();
			await globalEditor.importTemplateUI( filePath );
			await globalWpAdmin.closeAnnouncementsIfVisible();

			await globalEditor.setWidgetTab( 'content' );
			await globalEditor.openSection( 'section_navigation' );
			await globalEditor.setSelectControlValue( 'navigation_menu', 'Dropdown Hover Test Menu' );
			await globalEditor.closeSection( 'section_navigation' );

			await globalEditor.page.getByRole( 'button', { name: 'Publish' } ).click();
			await globalEditor.page.waitForTimeout( 200 );
			await globalEditor.page.goto( '/' );
		} );

		await test.step( 'Verify header and dropdown elements are present', async () => {
			const header = globalEditor.page.locator( WIDGET_CSS_CLASS );
			await expect( header ).toBeVisible();

			await globalEditor.page.waitForTimeout( 2000 );

			const allDropdownToggles = globalEditor.page.locator( DROPDOWN_TOGGLE_SELECTOR );
			const toggleCount = await allDropdownToggles.count();

			const allMenuItemsWithChildren = globalEditor.page.locator( MENU_ITEM_WITH_CHILDREN_SELECTOR );
			const menuItemCount = await allMenuItemsWithChildren.count();

			if ( 0 === toggleCount ) {
				const submenus = globalEditor.page.locator( '.sub-menu, .submenu, .dropdown' );
				const submenuCount = await submenus.count();

				expect( submenuCount ).toBeGreaterThan( 0 );
			}

			await expect( allDropdownToggles ).toHaveCount( toggleCount );
			await expect( allMenuItemsWithChildren ).toHaveCount( menuItemCount );
			await expect.soft( header ).toHaveScreenshot( 'header-dropdown-menu-before-hover.png' );
		} );

		await test.step( 'Test hover behavior on dropdown menu item', async () => {
			const dropdownToggles = globalEditor.page.locator( DROPDOWN_TOGGLE_SELECTOR );
			const toggleCount = await dropdownToggles.count();

			expect( toggleCount ).toBeGreaterThan( 0 );

			const menuItem = globalEditor.page.locator( MENU_ITEM_WITH_CHILDREN_SELECTOR ).first();
			const dropdown = menuItem.locator( DROPDOWN_MENU_SELECTOR );

			await expect( dropdown ).toHaveAttribute( 'aria-hidden', 'true' );

			await menuItem.hover();

			await expect( dropdown ).toHaveAttribute( 'aria-hidden', 'false' );

			await expect( dropdown ).toBeVisible();
			await expect( dropdown.locator( 'text=Child menu item' ) ).toBeVisible();

			await globalEditor.page.addStyleTag( {
				content: 'body { min-height: 480px !important; } main, footer, [data-elementor-type="ehp-footer"] { opacity: 0 !important; }',
			} );

			await expect.soft( globalEditor.page.locator( 'body' ) ).toHaveScreenshot( 'header-dropdown-menu-after-hover.png' );
		} );

		await test.step( 'Test dropdown closes when mouse leaves menu area', async () => {
			const dropdownToggles = globalEditor.page.locator( DROPDOWN_TOGGLE_SELECTOR );
			const toggleCount = await dropdownToggles.count();

			expect( toggleCount ).toBeGreaterThan( 0 );

			const menuItem = globalEditor.page.locator( MENU_ITEM_WITH_CHILDREN_SELECTOR ).first();
			const dropdown = menuItem.locator( DROPDOWN_MENU_SELECTOR );

			await menuItem.hover();
			await expect( dropdown ).toHaveAttribute( 'aria-hidden', 'false' );

			await globalEditor.page.mouse.move( 0, 0 );

			await expect( dropdown ).toHaveAttribute( 'aria-hidden', 'true' );
		} );

		await test.step( 'Test keyboard accessibility still works', async () => {
			const dropdownToggles = globalEditor.page.locator( DROPDOWN_TOGGLE_SELECTOR );
			const toggleCount = await dropdownToggles.count();

			expect( toggleCount ).toBeGreaterThan( 0 );

			const menuItem = globalEditor.page.locator( MENU_ITEM_WITH_CHILDREN_SELECTOR ).first();
			const dropdown = menuItem.locator( DROPDOWN_MENU_SELECTOR );
			const toggle = menuItem.locator( DROPDOWN_TOGGLE_SELECTOR );

			await toggle.focus();

			await toggle.press( 'Enter' );

			await expect( dropdown ).toHaveAttribute( 'aria-hidden', 'false' );

			await toggle.press( 'Enter' );

			await expect( dropdown ).toHaveAttribute( 'aria-hidden', 'true' );
		} );
	} );

	test( 'Dropdown menu behavior with submenu hover', async () => {
		if ( ! globalEditor ) {
			throw new Error( 'Global variables are undefined - beforeAll hook may have failed to initialize shared context' );
		}

		await test.step( 'Test that submenu stays open when moving from parent to submenu', async () => {
			const dropdownToggles = globalEditor.page.locator( DROPDOWN_TOGGLE_SELECTOR );
			const toggleCount = await dropdownToggles.count();

			expect( toggleCount ).toBeGreaterThan( 0 );

			const menuItem = globalEditor.page.locator( MENU_ITEM_WITH_CHILDREN_SELECTOR ).first();
			const dropdown = menuItem.locator( DROPDOWN_MENU_SELECTOR );

			await menuItem.hover();
			await expect( dropdown ).toHaveAttribute( 'aria-hidden', 'false' );

			await dropdown.hover();

			await expect( dropdown ).toHaveAttribute( 'aria-hidden', 'false' );

			await globalEditor.page.mouse.move( 0, 0 );

			await expect( dropdown ).toHaveAttribute( 'aria-hidden', 'true' );
		} );
	} );
} );
