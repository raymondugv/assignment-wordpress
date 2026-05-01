import { expect } from '@playwright/test';
import { parallelTest as test } from '../../../../parallelTest';
import WpAdminPage from '../../../../pages/wp-admin-page';

const WIDGET = {
    name: 'ehp-form',
    selector: '.ehp-form',
} as const;

const SELECTORS = {
    button: '.ehp-form__button',
    fields: {
        email: 'input[name="form_fields[email]"]',
    },
} as const;

const ADMIN_AJAX = /\/wp-admin\/admin-ajax\.php(\?.*)?$/;
const DEFAULT_EMAIL = 'someone@example.com';

let context;
let page;
let wpAdmin;
let editor;

async function addFormWidgetAndPublish() {
    await editor.addWidget( WIDGET.name );
    await editor.publishAndViewPage();
}

async function mockAdminAjax( payload: unknown ) {
    await page.route( ADMIN_AJAX, async ( route ) => {
        if ( 'POST' === route.request().method() ) {
            await route.fulfill( {
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify( payload ),
            } );
            return;
        }
        await route.continue();
    } );
}

async function ensureFormVisible() {
    await expect( page.locator( WIDGET.selector ) ).toBeVisible();
}

async function fillEmailAndSubmit( email: string = DEFAULT_EMAIL ) {
    await page.locator( SELECTORS.fields.email ).fill( email );
    await page.locator( SELECTORS.button ).click();
}

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

test( 'Submitting the form shows an error message when the server returns an error', async () => {
    const expectedError = 'Mocked form error';
    await addFormWidgetAndPublish();
    await mockAdminAjax( { success: false, data: { message: expectedError, errors: {}, data: {} } } );
    await ensureFormVisible();
    await fillEmailAndSubmit();
    const errorMessage = page.locator( '.elementor-message.elementor-message-danger' );
    await expect( errorMessage ).toBeVisible();
    await expect( errorMessage ).toHaveText( expectedError );
} );

test( 'Submitting the form shows a success message when the server returns success', async () => {
    const expectedSuccess = 'Mocked form success';
    await addFormWidgetAndPublish();
    await mockAdminAjax( { success: true, data: { message: expectedSuccess, data: {} } } );
    await ensureFormVisible();
    await fillEmailAndSubmit();
    const successMessage = page.locator( '.elementor-message.elementor-message-success' );
    await expect( successMessage ).toBeVisible();
    await expect( successMessage ).toHaveText( expectedSuccess );
} );

test( 'Submitting the form redirects to elementor.com when redirect_to is set', async () => {
    const redirectUrl = 'https://elementor.com/';

    await editor.addWidget( WIDGET.name );
    await editor.openSection( 'section_integration' );
    await editor.setSwitcherControlValue( 'should_redirect', true );
    await editor.setTextControlValue( 'redirect_to', redirectUrl );
    await editor.publishAndViewPage();
    await mockAdminAjax( { success: true, data: { message: 'ok', data: { redirect_url: redirectUrl } } } );

    await page.route( /https:\/\/elementor\.com\/?(.*)/, async ( route ) => {
        await route.fulfill( { status: 200, contentType: 'text/html', body: '<html><body>Redirected</body></html>' } );
    } );

    await ensureFormVisible();
    await fillEmailAndSubmit();

    await page.waitForURL( /https:\/\/elementor\.com\/?(.*)/ );
    expect( page.url().startsWith( redirectUrl ) ).toBeTruthy();
} );

