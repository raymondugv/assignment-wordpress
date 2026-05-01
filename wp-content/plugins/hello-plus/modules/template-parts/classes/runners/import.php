<?php
namespace HelloPlus\Modules\TemplateParts\Classes\Runners;

use Elementor\Core\Base\Document;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Elementor\App\Modules\ImportExport\Runners\Import\Import_Runner_Base;
use Elementor\App\Modules\ImportExport\Utils as ImportExportUtils;
use Elementor\TemplateLibrary\Source_Local;
use HelloPlus\Includes\Utils;

class Import extends Import_Runner_Base {

	private $import_session_id;

	private $import_session_metadata = [];

	public static function get_name(): string {
		return 'templates-ehp';
	}

	public function should_import( array $data ): bool {
		return (
			isset( $data['include'] ) &&
			is_array( $data['include'] ) &&
			in_array( 'templates', $data['include'], true ) &&
			! empty( $data['extracted_directory_path'] ) &&
			! empty( $data['manifest']['templates'] )
		);
	}

	public function import( array $data, array $imported_data ): array {
		$this->import_session_id = $data['session_id'];

		$path = $data['extracted_directory_path'] . 'templates/';
		$templates = $data['manifest']['templates'];

		$result['templates'] = [
			'succeed' => [],
			'failed' => [],
		];

		$menus = $imported_data['taxonomies']['nav_menu_item']['nav_menu'] ?? [];
		$renamed_menus = array_filter(
			$menus,
			function ( $menu ) {
				return isset( $menu['old_slug'], $menu['new_slug'] ) && $menu['old_slug'] !== $menu['new_slug'];
			}
		);

		foreach ( $templates as $id => $template_settings ) {
			try {
				$template_data = ImportExportUtils::read_json_file( $path . $id );
				if ( ! empty( $renamed_menus ) ) {
					$template_data = $this->replace_menus_in_template( $renamed_menus, $template_data );
				}
				$this->unpublish_by_doc_type( $template_settings['doc_type'] );
				$import = $this->import_template( $id, $template_settings, $template_data );

				$result['templates']['succeed'][ $id ] = $import;
			} catch ( \Exception $error ) {
				$result['templates']['failed'][ $id ] = $error->getMessage();
			}
		}

		return $result;
	}

	private function replace_menus_in_template( array $renamed_menus, array $template_data ) {
		$widget_type = $template_data['content'][0]['elements'][0]['widgetType'] ?? '';
		$settings = $template_data['content'][0]['elements'][0]['settings'] ?? [];

		$widget_types_to_replace = [
			'ehp-header' => true,
			'ehp-footer' => true,
			'ehp-flex-footer' => true,
		];

		if ( ! isset( $widget_types_to_replace[ $widget_type ] ) ) {
			return;
		}

		if ( empty( $settings ) || ! is_array( $settings ) ) {
			return;
		}

		$slug_map = [];
		foreach ( $renamed_menus as $menu ) {
			if ( is_array( $menu ) && isset( $menu['old_slug'], $menu['new_slug'] ) && $menu['old_slug'] !== $menu['new_slug'] ) {
				$slug_map[ $menu['old_slug'] ] = $menu['new_slug'];
			}
		}

		if ( empty( $slug_map ) ) {
			return;
		}

		$this->replace_values_in_data( $settings, $slug_map );

		$template_data['content'][0]['elements'][0]['settings'] = $settings;

		return $template_data;
	}

	private function replace_values_in_data( array &$data, array $slug_map ) {
		foreach ( $data as &$value ) {
			if ( is_string( $value ) ) {
				if ( isset( $slug_map[ $value ] ) ) {
					$value = $slug_map[ $value ];
				}
			} elseif ( is_array( $value ) ) {
				$this->replace_values_in_data( $value, $slug_map );
			}
		}

		unset( $value );
	}

	private function unpublish_by_doc_type( $doc_type ) {

		$doc_types_to_unpublish = [
			'ehp-header' => true,
			'ehp-footer' => true,
			'ehp-flex-footer' => true,
		];

		if ( ! isset( $doc_types_to_unpublish[ $doc_type ] ) ) {
			return;
		}

		$query = new \WP_Query( [
			'post_type' => Source_Local::CPT,
			'meta_key' => Document::TYPE_META_KEY ,
			'meta_value' => $doc_type,
			'post_status' => 'publish',
			'posts_per_page' => 100,
			'fields' => 'ids',
			'no_found_rows' => true,
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
		] );

		foreach ( $query->get_posts() as $post_id ) {
			wp_update_post( [
				'ID' => $post_id,
				'post_status' => 'draft',
			] );
		}
	}

	private function import_template( $id, array $template_settings, array $template_data ) {
		$doc_type = $template_settings['doc_type'];

		$new_document = Utils::elementor()->documents->create(
			$doc_type,
			[
				'post_title' => $template_settings['title'],
				'post_type' => Source_Local::CPT,
				'post_status' => 'publish',
			]
		);

		if ( is_wp_error( $new_document ) ) {
			throw new \Exception( esc_html( $new_document->get_error_message() ) );
		}

		$template_data['import_settings'] = $template_settings;
		$template_data['id'] = $id;

		$new_attachment_callback = function ( $attachment_id ) {
			$this->set_session_post_meta( $attachment_id, $this->import_session_id );
		};

		add_filter( 'elementor/template_library/import_images/new_attachment', $new_attachment_callback );

		$new_document->import( $template_data );

		remove_filter( 'elementor/template_library/import_images/new_attachment', $new_attachment_callback );

		$document_id = $new_document->get_main_id();

		$this->set_session_post_meta( $document_id, $this->import_session_id );

		$this->import_session_metadata['templates'][ $id ] = $document_id;

		return $document_id;
	}

	public function get_import_session_metadata(): array {
		return $this->import_session_metadata;
	}
}
