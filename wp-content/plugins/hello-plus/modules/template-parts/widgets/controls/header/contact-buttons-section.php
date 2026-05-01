<?php
namespace HelloPlus\Modules\TemplateParts\Widgets\Controls\Header;

use Elementor\Repeater;
use HelloPlus\Classes\Ehp_Social_Platforms;
use HelloPlus\Classes\Widgets\Abstract_Section;

class Contact_Buttons_Section extends Abstract_Section {

	private const DEFAULT_CONFIG = [
		'icon_default' => [
			'value' => 'fas fa-map-marker-alt',
			'library' => 'fa-solid',
		],
		'platform_default' => 'map',
	];

	protected function get_section_config(): array {
		return [
			'id' => 'section_contact_buttons',
			'args' => [
				'label' => esc_html__( 'Contact Buttons', 'hello-plus' ),
				'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
			],
		];
	}

	protected function add_section_controls(): void {
		$this->add_show_controls();
		$this->add_repeater_control();
	}

	private function add_show_controls(): void {
		$this->add_standard_show_control();
		$this->add_connect_show_control();
	}

	private function add_standard_show_control(): void {
		$this->add_control(
			'contact_buttons_show',
			[
				'label' => esc_html__( 'Show', 'hello-plus' ),
				'type' => \Elementor\Controls_Manager::SWITCHER,
				'label_on' => esc_html__( 'Yes', 'hello-plus' ),
				'label_off' => esc_html__( 'No', 'hello-plus' ),
				'return_value' => 'yes',
				'default' => '',
				'condition' => [
					'layout_preset_select!' => 'connect',
				],
			]
		);
	}

	private function add_connect_show_control(): void {
		$this->add_control(
			'contact_buttons_show_connect',
			[
				'label' => esc_html__( 'Show', 'hello-plus' ),
				'type' => \Elementor\Controls_Manager::SWITCHER,
				'label_on' => esc_html__( 'Yes', 'hello-plus' ),
				'label_off' => esc_html__( 'No', 'hello-plus' ),
				'return_value' => 'yes',
				'default' => 'yes',
				'condition' => [
					'layout_preset_select' => 'connect',
				],
			]
		);
	}

	private function add_repeater_control(): void {
		$widget = $this->get_widget();
		if ( ! $widget ) {
			return;
		}

		$repeater = new Repeater();
		$defaults = $this->get_defaults();

		$social_platforms = new Ehp_Social_Platforms(
			$widget,
			[
				'prefix_attr' => 'contact_buttons',
				'repeater' => $repeater,
			],
			$defaults
		);

		$social_platforms->add_repeater_controls();

		$this->add_control(
			'contact_buttons_repeater',
			[
				'type' => \Elementor\Controls_Manager::REPEATER,
				'fields' => $repeater->get_controls(),
				'prevent_empty' => true,
				'button_text' => esc_html__( 'Add Item', 'hello-plus' ),
				'title_field' => '{{{ contact_buttons_label }}}',
				'conditions' => $this->get_repeater_conditions(),
			]
		);
	}

	private function get_defaults(): array {
		return [
			'icon_default' => self::DEFAULT_CONFIG['icon_default'],
			'label_default' => esc_html__( 'Visit', 'hello-plus' ),
			'platform_default' => self::DEFAULT_CONFIG['platform_default'],
		];
	}

	private function get_repeater_conditions(): array {
		return [
			'relation' => 'or',
			'terms' => [
				$this->get_standard_layout_conditions(),
				$this->get_connect_layout_conditions(),
			],
		];
	}

	private function get_standard_layout_conditions(): array {
		return [
			'relation' => 'and',
			'terms' => [
				[
					'name' => 'layout_preset_select',
					'operator' => '!==',
					'value' => 'connect',
				],
				[
					'name' => 'contact_buttons_show',
					'operator' => '==',
					'value' => 'yes',
				],
			],
		];
	}

	private function get_connect_layout_conditions(): array {
		return [
			'relation' => 'and',
			'terms' => [
				[
					'name' => 'layout_preset_select',
					'operator' => '==',
					'value' => 'connect',
				],
				[
					'name' => 'contact_buttons_show_connect',
					'operator' => '==',
					'value' => 'yes',
				],
			],
		];
	}
}
