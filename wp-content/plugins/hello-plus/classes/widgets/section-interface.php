<?php
namespace HelloPlus\Classes\Widgets;

use Elementor\Widget_Base;

interface Section_Interface {
	public function add_to_widget( Widget_Base $widget ): void;
}
