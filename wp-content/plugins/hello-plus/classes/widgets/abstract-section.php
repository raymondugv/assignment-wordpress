<?php
namespace HelloPlus\Classes\Widgets;

use Elementor\Widget_Base;

abstract class Abstract_Section implements Section_Interface {

	protected Widget_Base $widget;

	abstract protected function get_section_config(): array;

	abstract protected function add_section_controls(): void;

	protected function start_section( string $section_id, array $args ): void {
		$this->widget->start_controls_section( $section_id, $args );
	}

	protected function get_widget(): ?Widget_Base {
		return $this->widget;
	}

	protected function end_section(): void {
		$this->widget->end_controls_section();
	}

	protected function add_control( string $control_id, array $args ): void {
		$this->widget->add_control( $control_id, $args );
	}

	public function add_to_widget( Widget_Base $widget ): void {
		$this->widget = $widget;
		$config = $this->get_section_config();
		$this->start_section( $config['id'], $config['args'] );
		$this->add_section_controls();
		$this->end_section();
	}
}
