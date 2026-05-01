import { type Page, type TestInfo } from '@playwright/test';
import EditorPage from '../pages/editor-page';
import { type Field } from '../types/types';
import EditorSelectors from '../selectors/editor-selectors';

declare global {
	interface Window {
		ElementorProFrontendConfig?: {
			ajaxurl?: string;
		};
	}
}

export default class Form {
	readonly page: Page;
	readonly editor: EditorPage;

	constructor( page: Page ) {
		this.page = page;
		this.editor = new EditorPage( page, {} as TestInfo );
	}

	public reCaptchaData = {
		reCaptcha: {
			siteKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
			secretKey: '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe',
		},
		reCaptchaV3: {
			siteKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
			secretKey: '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe',
			scoreThreshold: '0.5',
		},
	};

	async waitForEditPageButton(): Promise<void> {
		await this.page.getByRole( 'link', { name: 'Edit page' } ).waitFor();
	}

	async removeColumns(): Promise<void> {
		await this.page.locator( '.elementor-control-form_fields .elementor-repeater-tool-remove' ).first().click();
	}

	async addNewField(): Promise<void> {
		await this.page.locator( '.elementor-control-form_fields .elementor-repeater-add' ).click();
	}

	async setContentFieldData( field: Field ): Promise<void> {
		if ( field.type ) {
			await this.page.locator( '.elementor-control-field_type select' ).last().selectOption( field.type );
		}
		if ( field.placeholder ) {
			await this.page.locator( '.elementor-control-placeholder input' ).last().fill( field.placeholder );
		}
		if ( field.label ) {
			await this.page.locator( '.elementor-control-label input' ).last().fill( field.label );
		}
	}

	async setActionAfterSubmission( itemNames: string[] ): Promise<void> {
		await this.selectMultiSelectItems( 'section_integration', 'Add Action', itemNames );
	}

	private async selectMultiSelectItems( section: string, label: string, items: string[] ): Promise<void> {
		await this.editor.openSection( section );
		await this.clearMultiSelectInput();

		await this.page.getByText( label, { exact: true } ).click();

		for ( const item of items ) {
			await this.page.getByText( '+', { exact: true } ).click();
			await this.page.getByRole( 'treeitem', { name: item, exact: true } ).click();
		}
	}

	private async clearMultiSelectInput() {
		const xCount: number = await this.page.locator( EditorSelectors.form.removeActionSpan ).count();
		for ( let i: number = 0; i < xCount; i++ ) {
			await this.page.locator( EditorSelectors.form.removeActionSpan ).first().click();
		}
	}

	async submitForm(): Promise<void> {
		await this.page.locator( 'form .elementor-button' ).click();
	}

	async fillTextField( text: string, placeholder: string ): Promise<void> {
		await this.page.locator( `input[placeholder="${ placeholder }"]` ).fill( text );
	}

	async openSubmissions(): Promise<void> {
		await this.page.goto( '/wp-admin/edit.php?post_type=elementor_form' );
	}

	async toggleControls( selectors: string[] ): Promise<void> {
		for ( const selector of selectors ) {
			await this.page.locator( selector ).click();
		}
	}

	async mockIntegrations() {
		await this.page.route( '/wp-admin/admin-ajax.php', async ( route ) => {
			const requestPostData = route.request().postData();

			if ( requestPostData.includes( 'integrations_mailchimp' ) ) {
				const json = mailChimpMock;
				await route.fulfill( { json } );
			}

			if ( requestPostData.includes( 'publish' ) ) {
				await route.fallback();
			}
			if ( requestPostData.includes( 'elementor_pro_forms_send_form' ) ) {
				await route.fallback();
			}
		} );
	}
}

const mailChimpMock = {
	success: true,
	data: {
		responses: {
			integrations_mailchimp: {
				success: true,
				code: 200,
				data: {
					lists: {
						'': 'Select...',
						e99492a400: 'Elementor',
					},
					list_details: {
						groups: {
							'9c9fed3bd0': 'GROUP CAT 1 - A',
							'5da1a5b9e8': 'GROUP CAT 1 - B',
							ae39e66269: 'GROUP CAT 1 - C',
							'723b4688d2': 'GROUP CAT 1 - D',
							a8c35c75a3: 'GROUP CAT 1 - E',
							'44556bada5': 'GROUP CAT 1 - F',
							'4fb52e0814': 'GROUP CAT 1 - G',
							'6a1497d4a1': 'GROUP CAT 1 - H',
							'0f0985320a': 'GROUP CAT 1 - I',
							cdb2d0ad22: 'GROUP CAT 1 - J',
							d7f2a49a48: 'GROUP CAT 1 - K',
							c59d041b89: 'GROUP CAT 1 - L',
							d8abdc7d31: 'GROUP CAT 1 - M',
							'610813f1ce': 'GROUP CAT 1 - N',
							'65521ca1c2': 'GROUP CAT 1 - O',
							'4ca855e475': 'GROUP CAT 1 - P',
							'824b91989c': 'GROUP CAT 1 - Q',
							'3f77fe0788': 'GROUP CAT 1 - R',
							b39207c4b1: 'GROUP CAT 1 - S',
							c032c2f88d: 'GROUP CAT 1 - T',
						},
						fields: [
							{
								remote_label: 'Email',
								remote_type: 'email',
								remote_id: 'email',
								remote_required: true,
							},
							{
								remote_label: 'Address',
								remote_type: 'text',
								remote_id: 'ADDRESS',
								remote_required: false,
							},
							{
								remote_label: 'Birthday',
								remote_type: 'text',
								remote_id: 'BIRTHDAY',
								remote_required: false,
							},
							{
								remote_label: 'First Name',
								remote_type: 'text',
								remote_id: 'FNAME',
								remote_required: false,
							},
							{
								remote_label: 'Last Name',
								remote_type: 'text',
								remote_id: 'LNAME',
								remote_required: false,
							},
							{
								remote_label: 'Phone Number',
								remote_type: 'text',
								remote_id: 'PHONE',
								remote_required: false,
							},
						],
					},
				},
			},
		},
	},
};
