import { parallelTest as test } from '../../parallelTest';
import { expect } from '@playwright/test';

test.describe( 'Woocommerce compatibility tests', () => {
	test( 'Verify that Woocommerce works with Hello Plus', async ( { page } ) => {
		await test.step( 'Assert that you can add a product to the cart', async () => {
			await page.goto( '/product/beanie-with-logo/' );

			await expect( page.locator( '#main > .product' ) ).toBeVisible();
			const button = page.getByRole( 'button', { name: 'Add to Cart' } ).first();
			await expect( button ).toBeVisible();
			await button.click();
			await expect( page.locator( '.woocommerce-message' ) ).toBeVisible();
		} );
	} );
} );
