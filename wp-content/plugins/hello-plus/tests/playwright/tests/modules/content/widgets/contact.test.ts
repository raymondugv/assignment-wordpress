import { expect } from '@playwright/test';
import { parallelTest as test } from '../../../../parallelTest';
import WpAdminPage from '../../../../pages/wp-admin-page';
import { viewportSize } from '../../../../enums/viewport-sizes';

const WIDGET_CSS_CLASS = '.ehp-contact';

const MOBILE_MAP_HIDE_CSS = '<style>@media (max-width: 600px) { .ehp-contact__map iframe { opacity: 0; } .ehp-contact__map { background: #eeeeee; } }</style>';

const CONTROL_VALUES = {
    presets: [ 'locate', 'touchpoint', 'quick-info' ],
    headingTags: [ 'h2', 'h4', 'div' ],
    descriptionTags: [ 'p', 'div', 'span' ],
    alignmentVertical: [ 'eicon-align-start-v', 'eicon-align-center-v', 'eicon-align-end-v' ],
    alignmentHorizontal: [ 'eicon-align-start-h', 'eicon-align-center-h' ],
    horizontalMapPositions: [ 'eicon-h-align-left', 'eicon-h-align-right' ],
    verticalMapPositions: [ 'eicon-align-start-v', 'eicon-align-end-v' ],
    columns: [ '1', '2', '3', '4' ],
    contentWidth: [ '800', '600', '1000' ],
    gaps: [ { column: '20', row: '20' }, { column: '30', row: '30' }, { column: '40', row: '40' } ],
    mapHeights: [ '400', '540', '600' ],
    backgroundColors: [ '#F6F7F8', '#2196F3', '#4CAF50' ],
    headingColors: [ '#333333', '#222222', '#111111' ],
    descriptionColors: [ '#666666', '#444444', '#888888' ],
    subheadingColors: [ '#9C27B0', '#03A9F4', '#FF5722' ],
    contactTextColors: [ '#212121', '#455A64', '#37474F' ],
    socialIconColors: [ '#607D8B', '#795548', '#009688' ],
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

test( 'Contact widget can be added to the page', async () => {
    await editor.addWidget( 'contact' );

    const previewFrame = editor.getPreviewFrame();
    const widget = previewFrame.locator( WIDGET_CSS_CLASS );
    await expect( widget ).toBeVisible();
    await editor.hideContactMapControls();
    await editor.togglePreviewMode();
    await expect.soft( widget ).toHaveScreenshot( 'contact-default-editor.png' );
    await editor.togglePreviewMode();

    await editor.addWidget( 'html' );
    await editor.setTextareaControlValue( 'type-code', MOBILE_MAP_HIDE_CSS );
    await editor.publishAndViewPage();
    const publishedUrl = page.url();
    const frontendWidget = page.locator( WIDGET_CSS_CLASS );
    await expect( frontendWidget ).toBeVisible();
    await expect.soft( frontendWidget ).toHaveScreenshot( 'contact-default-frontend.png' );
    await page.setViewportSize( viewportSize.tablet );
    await expect.soft( frontendWidget ).toHaveScreenshot( 'contact-default-frontend-tablet.png' );
    await page.setViewportSize( viewportSize.mobile );
    await expect.soft( frontendWidget ).toHaveScreenshot( 'contact-default-frontend-mobile.png' );
    await page.setViewportSize( viewportSize.desktop );

    await wpAdmin.setSiteLanguage( 'he_IL' );
    await page.goto( publishedUrl );
    await expect( frontendWidget ).toBeVisible();
    await expect.soft( frontendWidget ).toHaveScreenshot( 'contact-default-frontend-rtl.png' );
    await page.setViewportSize( viewportSize.tablet );
    await expect.soft( frontendWidget ).toHaveScreenshot( 'contact-default-frontend-rtl-tablet.png' );
    await page.setViewportSize( viewportSize.mobile );
    await expect.soft( frontendWidget ).toHaveScreenshot( 'contact-default-frontend-rtl-mobile.png' );
    await wpAdmin.setSiteLanguage( '' );
    await page.waitForTimeout( 500 );
} );

for ( let loopIndex = 0; loopIndex < 3; loopIndex++ ) {
    test( `Contact randomized configuration test ${ loopIndex + 1 }`, async () => {
        await editor.addWidget( 'contact' );
        await editor.waitForPanelToLoad();

        const previewFrame = editor.getPreviewFrame();
        const editorWidget = previewFrame.locator( WIDGET_CSS_CLASS );
        await expect( editorWidget ).toBeVisible();

        await editor.setWidgetTab( 'content' );

        const preset = editor.getControlValueByIndex( CONTROL_VALUES.presets, loopIndex );
        await editor.openSection( 'layout_section' );
        await editor.setPresetImageControlValue( 'layout_preset', preset );

        await editor.openSection( 'text_section' );
        await editor.setSelectControlValue( 'heading_tag', editor.getControlValueByIndex( CONTROL_VALUES.headingTags, loopIndex ) );
        await editor.setSelectControlValue( 'description_tag', editor.getControlValueByIndex( CONTROL_VALUES.descriptionTags, loopIndex ) );
        await editor.closeSection( 'text_section' );

        await editor.openSection( 'contact_details_section' );
        if ( 1 === loopIndex ) {
            await editor.setSelectControlValue( 'subheading_tag', 'h4' );
        }
        const socialRepeater = page.locator( '.elementor-control-group_4_social_repeater' );
        if ( await socialRepeater.isVisible() ) {
            await socialRepeater.getByRole( 'button', { name: 'Add Item' } ).first().click();
            await page.locator( '.elementor-control-group_4_social_label input' ).last().fill( 'Threads' );
        }
        await editor.closeSection( 'contact_details_section' );

        await editor.setWidgetTab( 'style' );

        await editor.openSection( 'layout_style_section' );
        await editor.setGapControlValue( 'space_between_widgets', editor.getControlValueByIndex( CONTROL_VALUES.gaps, loopIndex ) );

        if ( 'locate' === preset ) {
            await editor.setChooseControlValue( 'map_position_horizontal', editor.getControlValueByIndex( CONTROL_VALUES.horizontalMapPositions, loopIndex ) );
            await editor.setChooseControlValue( 'content_alignment_locate', editor.getControlValueByIndex( CONTROL_VALUES.alignmentVertical, loopIndex ) );
            await editor.setSelectControlValue( 'contact_details_columns_locate', editor.getControlValueByIndex( CONTROL_VALUES.columns, loopIndex ) );
        }

        if ( 'touchpoint' === preset ) {
            await editor.setChooseControlValue( 'content_position', editor.getControlValueByIndex( CONTROL_VALUES.alignmentHorizontal, loopIndex ) );
            await editor.setChooseControlValue( 'content_alignment_reduced', editor.getControlValueByIndex( CONTROL_VALUES.alignmentHorizontal, loopIndex ) );
            await editor.setSelectControlValue( 'contact_details_columns_alt', editor.getControlValueByIndex( CONTROL_VALUES.columns, loopIndex ) );
            await editor.setSliderControlValue( 'content_width', editor.getControlValueByIndex( CONTROL_VALUES.contentWidth, loopIndex ) );
            await editor.setChooseControlValue( 'map_position_vertical', editor.getControlValueByIndex( CONTROL_VALUES.verticalMapPositions, loopIndex ) );
        }

        if ( 'quick-info' === preset ) {
            await editor.setChooseControlValue( 'content_position', editor.getControlValueByIndex( CONTROL_VALUES.alignmentHorizontal, loopIndex ) );
            await editor.setChooseControlValue( 'content_alignment_reduced', editor.getControlValueByIndex( CONTROL_VALUES.alignmentHorizontal, loopIndex ) );
            await editor.setSelectControlValue( 'contact_details_columns_alt', editor.getControlValueByIndex( CONTROL_VALUES.columns, loopIndex ) );
            await editor.setSliderControlValue( 'content_width', editor.getControlValueByIndex( CONTROL_VALUES.contentWidth, loopIndex ) );
        }
        await editor.closeSection( 'layout_style_section' );

        if ( preset !== 'quick-info' ) {
            await editor.openSection( 'map_style_section' );
            await editor.setSliderControlValue( 'map_height', editor.getControlValueByIndex( CONTROL_VALUES.mapHeights, loopIndex ) );
            await editor.setSwitcherControlValue( 'map_stretch', true );
            await editor.setSwitcherControlValue( 'show_map_border', true );
            await editor.setSliderControlValue( 'map_border_width', '1' );
            await editor.closeSection( 'map_style_section' );
        }

        await editor.openSection( 'text_style_section' );
        await editor.setColorControlValue( 'heading_color', editor.getControlValueByIndex( CONTROL_VALUES.headingColors, loopIndex ) );
        await editor.setColorControlValue( 'description_color', editor.getControlValueByIndex( CONTROL_VALUES.descriptionColors, loopIndex ) );
        await editor.setSliderControlValue( 'text_spacing', '24' );
        await editor.closeSection( 'text_style_section' );

        await editor.openSection( 'contact_details_style_section' );
        await editor.setColorControlValue( 'contact_details_subheading_color', editor.getControlValueByIndex( CONTROL_VALUES.subheadingColors, loopIndex ) );
        await editor.setSliderControlValue( 'contact_details_text_spacing', '8' );

        await editor.setColorControlValue( 'contact_details_icon_color', '#2196F3' );
        await editor.setSliderControlValue( 'contact_details_icon_size', '16' );
        await editor.setSliderControlValue( 'contact_details_icon_gap', '8' );

        await editor.setColorControlValue( 'contact_details_text_color', editor.getControlValueByIndex( CONTROL_VALUES.contactTextColors, loopIndex ) );

        await editor.setColorControlValue( 'contact_details_social_icon_color', editor.getControlValueByIndex( CONTROL_VALUES.socialIconColors, loopIndex ) );
        await editor.setSliderControlValue( 'contact_details_social_icon_size', '16' );
        await editor.setSliderControlValue( 'contact_details_social_icon_gap', '8' );
        await editor.closeSection( 'contact_details_style_section' );

        await editor.openSection( 'box_style_section' );
        await editor.setBackgroundColorControlValue( 'background_background', 'background_color', editor.getControlValueByIndex( CONTROL_VALUES.backgroundColors, loopIndex ) );
        await editor.setBackgroundColorControlValue( 'background_overlay_background', 'background_overlay_color', '#000000' );
        await editor.setSliderControlValue( 'background_overlay_opacity', '0.4' );
        await editor.setSwitcherControlValue( 'show_box_border', true );
        await editor.setSliderControlValue( 'box_border_width', '1' );
        await editor.setSliderControlValue( 'box_element_spacing', '32' );
        await editor.setSliderControlValue( 'box_gap', '60' );
        await editor.closeSection( 'box_style_section' );

        if ( preset !== 'quick-info' ) {
            await editor.hideContactMapControls();
        }
        await editor.togglePreviewMode();
        await expect.soft( editorWidget ).toHaveScreenshot( `contact-config-${ loopIndex + 1 }-editor.png` );
        await editor.togglePreviewMode();

        await editor.addWidget( 'html' );
        await editor.setTextareaControlValue( 'type-code', MOBILE_MAP_HIDE_CSS );
        await editor.publishAndViewPage();
        const publishedUrl = page.url();
        const frontendWidget = page.locator( WIDGET_CSS_CLASS );
        await expect( frontendWidget ).toBeVisible();
        await expect.soft( frontendWidget ).toHaveScreenshot( `contact-config-${ loopIndex + 1 }-frontend.png` );
        await page.setViewportSize( viewportSize.tablet );
        await expect.soft( frontendWidget ).toHaveScreenshot( `contact-config-${ loopIndex + 1 }-frontend-tablet.png` );
        await page.setViewportSize( viewportSize.mobile );
        await expect.soft( frontendWidget ).toHaveScreenshot( `contact-config-${ loopIndex + 1 }-frontend-mobile.png` );
        await page.setViewportSize( viewportSize.desktop );

        await wpAdmin.setSiteLanguage( 'he_IL' );
        await page.goto( publishedUrl );
        await expect( frontendWidget ).toBeVisible();
        await expect.soft( frontendWidget ).toHaveScreenshot( `contact-config-${ loopIndex + 1 }-frontend-rtl.png` );
        await page.setViewportSize( viewportSize.tablet );
        await expect.soft( frontendWidget ).toHaveScreenshot( `contact-config-${ loopIndex + 1 }-frontend-rtl-tablet.png` );
        await page.setViewportSize( viewportSize.mobile );
        await expect.soft( frontendWidget ).toHaveScreenshot( `contact-config-${ loopIndex + 1 }-frontend-rtl-mobile.png` );
        await wpAdmin.setSiteLanguage( '' );
        await page.waitForTimeout( 500 );
    } );
}
