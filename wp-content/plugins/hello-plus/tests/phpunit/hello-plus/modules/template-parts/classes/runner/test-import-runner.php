<?php

use PHPUnit\Framework\TestCase;
use HelloPlus\Modules\TemplateParts\Classes\Runners\Import;

class Import_Runner_Test extends TestCase {

	private $import_runner;
	private $mock_import_runner;

	protected function setUp(): void {
		parent::setUp();

		$this->import_runner = new Import();

		$this->mock_import_runner = $this->getMockBuilder( Import::class )
			->onlyMethods( [ 'set_session_post_meta' ] )
			->getMock();
	}

	protected function tearDown(): void {
		parent::tearDown();
		if ( function_exists( 'wp_reset_postdata' ) ) {
			wp_reset_postdata();
		}
	}

	public function test_import_method_complete_flow() {
		if ( ! class_exists( 'Elementor\App\Modules\ImportExport\Utils' ) ) {
			$this->markTestSkipped( 'Elementor ImportExport Utils not available' );
		}

		$data = [
			'session_id' => 'test_session_123',
			'extracted_directory_path' => '/tmp/test/',
			'manifest' => [
				'templates' => [
					'template1' => [
						'doc_type' => 'ehp-header',
						'title' => 'Test Header',
					],
				],
			],
		];

		$imported_data = [
			'taxonomies' => [
				'nav_menu_item' => [
					'nav_menu' => [],
				],
			],
		];

		$this->mock_import_runner
			->method( 'set_session_post_meta' )
			->willReturn( true );

		$reflection = new ReflectionClass( $this->mock_import_runner );
		$import_method = $reflection->getMethod( 'import' );
		$import_method->setAccessible( true );

		try {
			$result = $import_method->invoke( $this->mock_import_runner, $data, $imported_data );
			$this->assertIsArray( $result );
			$this->assertArrayHasKey( 'templates', $result );
			$this->assertArrayHasKey( 'succeed', $result['templates'] );
			$this->assertArrayHasKey( 'failed', $result['templates'] );
		} catch ( Exception $e ) {
			$this->assertStringContainsString( 'Elementor', $e->getMessage() );
		}
	}

	public function test_replace_menus_in_template_functionality() {
		$renamed_menus = [
			[
				'old_slug' => 'old-menu',
				'new_slug' => 'new-menu',
			],
		];

		$template_data = [
			'content' => [
				[
					'elements' => [
						[
							'widgetType' => 'ehp-header',
							'settings' => [
								'menu_id' => 'old-menu',
								'other_setting' => 'value',
							],
						],
					],
				],
			],
		];

		$reflection = new ReflectionClass( $this->import_runner );
		$method = $reflection->getMethod( 'replace_menus_in_template' );
		$method->setAccessible( true );

		$result = $method->invoke( $this->import_runner, $renamed_menus, $template_data );

		$this->assertIsArray( $result );
		$this->assertEquals( 'new-menu', $result['content'][0]['elements'][0]['settings']['menu_id'] );
		$this->assertEquals( 'value', $result['content'][0]['elements'][0]['settings']['other_setting'] );
	}

	public function test_replace_menus_in_template_with_non_matching_widget() {
		$renamed_menus = [
			[
				'old_slug' => 'old-menu',
				'new_slug' => 'new-menu',
			],
		];

		$template_data = [
			'content' => [
				[
					'elements' => [
						[
							'widgetType' => 'other-widget',
							'settings' => [
								'menu_id' => 'old-menu',
							],
						],
					],
				],
			],
		];

		$reflection = new ReflectionClass( $this->import_runner );
		$method = $reflection->getMethod( 'replace_menus_in_template' );
		$method->setAccessible( true );

		$result = $method->invoke( $this->import_runner, $renamed_menus, $template_data );
		$this->assertNull( $result );
	}

	public function test_replace_menus_in_template_with_empty_settings() {
		$renamed_menus = [
			[
				'old_slug' => 'old-menu',
				'new_slug' => 'new-menu',
			],
		];

		$template_data = [
			'content' => [
				[
					'elements' => [
						[
							'widgetType' => 'ehp-header',
							'settings' => [],
						],
					],
				],
			],
		];

		$reflection = new ReflectionClass( $this->import_runner );
		$method = $reflection->getMethod( 'replace_menus_in_template' );
		$method->setAccessible( true );

		$result = $method->invoke( $this->import_runner, $renamed_menus, $template_data );
		$this->assertNull( $result );
	}

	public function test_replace_values_in_data_with_nested_structures() {
		$slug_map = [
			'old-menu' => 'new-menu',
			'old-page' => 'new-page',
		];

		$data = [
			'menu_id' => 'old-menu',
			'nested' => [
				'page_id' => 'old-page',
				'deep' => [
					'another_menu' => 'old-menu',
				],
			],
			'unchanged' => 'value',
		];

		$reflection = new ReflectionClass( $this->import_runner );
		$method = $reflection->getMethod( 'replace_values_in_data' );
		$method->setAccessible( true );

		$args = [ &$data, $slug_map ];
		$method->invokeArgs( $this->import_runner, $args );

		$this->assertEquals( 'new-menu', $data['menu_id'] );
		$this->assertEquals( 'new-page', $data['nested']['page_id'] );
		$this->assertEquals( 'new-menu', $data['nested']['deep']['another_menu'] );
		$this->assertEquals( 'value', $data['unchanged'] );
	}

	public function test_replace_values_in_data_with_mixed_types() {
		$slug_map = [
			'old-menu' => 'new-menu',
		];

		$data = [
			'string_value' => 'old-menu',
			'numeric_value' => 123,
			'boolean_value' => true,
			'null_value' => null,
			'array_value' => [ 'old-menu', 'other-value' ],
		];

		$reflection = new ReflectionClass( $this->import_runner );
		$method = $reflection->getMethod( 'replace_values_in_data' );
		$method->setAccessible( true );

		$args = [ &$data, $slug_map ];
		$method->invokeArgs( $this->import_runner, $args );

		$this->assertEquals( 'new-menu', $data['string_value'] );
		$this->assertEquals( 123, $data['numeric_value'] );
		$this->assertTrue( $data['boolean_value'] );
		$this->assertNull( $data['null_value'] );
		$this->assertEquals( [ 'new-menu', 'other-value' ], $data['array_value'] );
	}

	public function test_unpublish_by_doc_type_with_valid_type() {
		$doc_type = 'ehp-header';

		$reflection = new ReflectionClass( $this->import_runner );
		$method = $reflection->getMethod( 'unpublish_by_doc_type' );
		$method->setAccessible( true );

		try {
			$method->invoke( $this->import_runner, $doc_type );
			$this->assertTrue( true );
		} catch ( Exception $e ) {
			$this->assertStringContainsString( 'WordPress', $e->getMessage() );
		}
	}

	public function test_unpublish_by_doc_type_with_invalid_type() {
		$doc_type = 'invalid-type';

		$reflection = new ReflectionClass( $this->import_runner );
		$method = $reflection->getMethod( 'unpublish_by_doc_type' );
		$method->setAccessible( true );

		$result = $method->invoke( $this->import_runner, $doc_type );
		$this->assertNull( $result );
	}

	public function test_import_template_method_structure() {
		$id = 'test-template';
		$template_settings = [
			'doc_type' => 'ehp-header',
			'title' => 'Test Template',
		];
		$template_data = [
			'content' => [],
			'settings' => [],
		];

		$reflection = new ReflectionClass( $this->import_runner );
		$method = $reflection->getMethod( 'import_template' );
		$method->setAccessible( true );

		try {
			$result = $method->invoke( $this->import_runner, $id, $template_settings, $template_data );
			$this->assertIsInt( $result );
		} catch ( Exception $e ) {
			$this->assertTrue(
				( strpos( $e->getMessage(), 'Elementor' ) !== false ) ||
				( strpos( $e->getMessage(), 'thumbnail' ) !== false )
			);
		}
	}

	public function test_session_metadata_management() {
		$metadata = $this->import_runner->get_import_session_metadata();
		$this->assertEmpty( $metadata );

		$reflection = new ReflectionClass( $this->import_runner );
		$property = $reflection->getProperty( 'import_session_metadata' );
		$property->setAccessible( true );

		$test_metadata = [
			'templates' => [
				'template1' => 123,
				'template2' => 456,
			],
		];

		$property->setValue( $this->import_runner, $test_metadata );
		$metadata = $this->import_runner->get_import_session_metadata();
		$this->assertEquals( $test_metadata, $metadata );
	}

	public function test_should_import_edge_cases() {
		$data = [
			'include' => [],
			'extracted_directory_path' => '/tmp/test/',
			'manifest' => [ 'templates' => [ 'template1' ] ],
		];
		$this->assertFalse( $this->import_runner->should_import( $data ) );

		$data = [
			'include' => null,
			'extracted_directory_path' => '/tmp/test/',
			'manifest' => [ 'templates' => [ 'template1' ] ],
		];
		$this->assertFalse( $this->import_runner->should_import( $data ) );

		$data = [
			'include' => 'templates',
			'extracted_directory_path' => '/tmp/test/',
			'manifest' => [ 'templates' => [ 'template1' ] ],
		];
		$this->assertFalse( $this->import_runner->should_import( $data ) );
	}
}
