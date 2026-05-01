import { expect } from '@playwright/test';
import { parallelTest as test } from '../../../../parallelTest';
import WpAdminPage from '../../../../pages/wp-admin-page';
import { viewportSize } from '../../../../enums/viewport-sizes';

const WIDGET_CSS_CLASS = '.ehp-cta';

const CONTROL_VALUES = {
    presets: [ 'focus', 'streamline', 'showcase', 'storytelling' ],
    alignment: [ 'eicon-align-start-h', 'eicon-align-center-h' ],
    verticalPosition: [ 'eicon-align-start-v', 'eicon-align-end-v' ],
    contentWidth: [ '800', '400', '1000' ],
    columnStructures: [ '50-50', '33-66', '25-75' ],
    imagePositions: [ 'center center', 'top left', 'bottom right' ],
    backgroundColors: [ '#F6F7F8', '#2196F3', '#4CAF50' ],
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

test( 'CTA widget can be added to the page', async () => {
    await editor.addWidget( 'cta' );

    const previewFrame = editor.getPreviewFrame();
    const widget = previewFrame.locator( WIDGET_CSS_CLASS );
    await expect( widget ).toBeVisible();
    await expect.soft( widget ).toHaveScreenshot( 'cta-default-editor.png' );

    await editor.publishAndViewPage();

    const frontendWidget = page.locator( WIDGET_CSS_CLASS );
    await expect( frontendWidget ).toBeVisible();
    await expect.soft( frontendWidget ).toHaveScreenshot( 'cta-default-frontend.png' );
    await page.setViewportSize( viewportSize.tablet );
    await expect.soft( frontendWidget ).toHaveScreenshot( 'cta-default-frontend-tablet.png' );
    await page.setViewportSize( viewportSize.mobile );
    await expect.soft( frontendWidget ).toHaveScreenshot( 'cta-default-frontend-mobile.png' );
} );

for ( let loopIndex = 0; loopIndex < 3; loopIndex++ ) {
    test( `CTA randomized configuration test ${ loopIndex + 1 }`, async () => {
        await editor.addWidget( 'cta' );
        await editor.waitForPanelToLoad();

        const previewFrame = editor.getPreviewFrame();
        const editorWidget = previewFrame.locator( WIDGET_CSS_CLASS );
        await expect( editorWidget ).toBeVisible();

        await editor.setWidgetTab( 'content' );

        const preset = editor.getControlValueByIndex( CONTROL_VALUES.presets, loopIndex + 1 );
        await editor.openSection( 'layout' );
        await editor.setPresetImageControlValue( 'layout_preset', preset );
        await editor.closeSection( 'layout' );

        // Set icons and secondary toggle in Content tab where those controls live
        await editor.openSection( 'content_cta' );
        await editor.setIconControlValueByName( 'primary_cta_button_icon', 'Address book' );
        const toggleSecondaryOn = 0 === loopIndex % 2;
        await editor.setSwitcherControlValue( 'secondary_cta_show', toggleSecondaryOn );
        if ( toggleSecondaryOn ) {
            await editor.setIconControlValueByName( 'secondary_cta_button_icon', 'Address book' );
        }
        await editor.closeSection( 'content_cta' );

        await editor.setWidgetTab( 'style' );

        if ( 'focus' === preset ) {
            await editor.setChooseControlValue( 'cta_vertical_position', editor.getControlValueByIndex( CONTROL_VALUES.verticalPosition, loopIndex ) );
            await editor.setSliderControlValue( 'content_width', editor.getControlValueByIndex( CONTROL_VALUES.contentWidth, loopIndex ) );
        }

        if ( 'streamline' === preset || 'storytelling' === preset ) {
            await editor.setChooseControlValue( 'content_alignment', editor.getControlValueByIndex( CONTROL_VALUES.alignment, loopIndex ) );
            await editor.setSliderControlValue( 'content_width', editor.getControlValueByIndex( CONTROL_VALUES.contentWidth, loopIndex ) );
        }

        if ( 'showcase' === preset ) {
            await editor.openSection( 'style_layout' );
            const structure = editor.getControlValueByIndex( CONTROL_VALUES.columnStructures, loopIndex );
            await editor.setPresetImageControlValue( 'layout_column_structure', structure );
            if ( structure !== '50-50' ) {
                await editor.setSwitcherControlValue( 'layout_reverse_structure', 0 === loopIndex % 2 );
            }
            await editor.closeSection( 'style_layout' );
        }

        if ( 'showcase' === preset || 'storytelling' === preset ) {
            await editor.openSection( 'style_image' );
            const stretchOn = 0 === loopIndex % 2;
            await editor.setSwitcherControlValue( 'image_stretch', stretchOn );
            if ( stretchOn ) {
                await editor.setSliderControlValue( 'image_min_height', '300' );
            } else {
                await editor.setSliderControlValue( 'image_height', '320' );
                await editor.setSliderControlValue( 'image_width', '90' );
            }
            await editor.setSelectControlValue( 'image_position', editor.getControlValueByIndex( CONTROL_VALUES.imagePositions, loopIndex ) );
            await editor.setSwitcherControlValue( 'show_image_border', true );
            await editor.setSliderControlValue( 'image_border_width', '2' );
            await editor.closeSection( 'style_image' );
        }

        await editor.openSection( 'style_cta' );
        await editor.setSelectControlValue( 'primary_button_type', 'button' );
        await editor.setSwitcherControlValue( 'primary_show_button_border', true );
        await editor.setSliderControlValue( 'primary_button_border_width', '2' );

        if ( toggleSecondaryOn ) {
            await editor.setSelectControlValue( 'secondary_button_type', 'button' );
            await editor.setSliderControlValue( 'cta_space_between', '24' );
        }

        if ( 'streamline' === preset || 'storytelling' === preset ) {
            await editor.setSelectControlValue( 'cta_width', 'stretch' );
            await editor.setSelectControlValue( 'cta_position', 'end' );
        }
        await editor.closeSection( 'style_cta' );

        await editor.openSection( 'style_box_section' );
        await editor.setBackgroundColorControlValue( 'background_background', 'background_color', editor.getControlValueByIndex( CONTROL_VALUES.backgroundColors, loopIndex ) );
        await editor.setBackgroundColorControlValue( 'background_overlay_background', 'background_overlay_color', '#000000' );
        await editor.setSliderControlValue( 'background_overlay_opacity', '0.4' );
        await editor.setSwitcherControlValue( 'show_box_border', true );
        await editor.setSliderControlValue( 'box_border_width', '1' );

        await editor.setSwitcherControlValue( 'box_full_screen_height', true );
        await editor.closeSection( 'style_box_section' );

        await expect.soft( editorWidget ).toHaveScreenshot( `cta-config-${ loopIndex + 1 }-editor.png` );

        await editor.publishAndViewPage();

        const frontendWidget = page.locator( WIDGET_CSS_CLASS );
        await expect( frontendWidget ).toBeVisible();
        await expect.soft( frontendWidget ).toHaveScreenshot( `cta-config-${ loopIndex + 1 }-frontend.png` );
        await page.setViewportSize( viewportSize.tablet );
        await expect.soft( frontendWidget ).toHaveScreenshot( `cta-config-${ loopIndex + 1 }-frontend-tablet.png` );
        await page.setViewportSize( viewportSize.mobile );
        await expect.soft( frontendWidget ).toHaveScreenshot( `cta-config-${ loopIndex + 1 }-frontend-mobile.png` );
    } );
}

