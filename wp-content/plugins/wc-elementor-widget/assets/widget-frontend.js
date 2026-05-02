(function ($) {
    "use strict";

    $(document).ready(function () {
        function validateProductInput(name, price) {
            var normalizedName = $.trim(name);
            var normalizedPrice = $.trim(price);

            if (!normalizedName) {
                return { valid: false, message: "Please enter a product name." };
            }
            if (normalizedName.length < 3) {
                return {
                    valid: false,
                    message: "Product name must be at least 3 characters.",
                };
            }
            if (normalizedName.length > 100) {
                return {
                    valid: false,
                    message: "Product name must be 100 characters or fewer.",
                };
            }
            if (!/^[\w\s\-.,()&]+$/u.test(normalizedName)) {
                return {
                    valid: false,
                    message:
                        "Product name contains invalid characters. Use letters, numbers, spaces, and - . , ( ) &",
                };
            }

            if (normalizedPrice === "") {
                return { valid: false, message: "Please enter a valid price." };
            }

            var parsedPrice = Number(normalizedPrice);
            if (!isFinite(parsedPrice) || parsedPrice < 0) {
                return {
                    valid: false,
                    message: "Please enter a valid price (0 or higher).",
                };
            }

            if (!/^\d+(\.\d{1,2})?$/.test(normalizedPrice)) {
                return {
                    valid: false,
                    message: "Price can have up to 2 decimal places only.",
                };
            }

            return {
                valid: true,
                name: normalizedName,
                price: parsedPrice.toFixed(2),
            };
        }

        // Product card scroll animation
        if ("IntersectionObserver" in window) {
            var observer = new IntersectionObserver(
                function (entries) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) {
                            $(entry.target).addClass("is-visible");
                            observer.unobserve(entry.target);
                        }
                    });
                },
                { threshold: 0.1 },
            );

            $(".wc-product-card").each(function () {
                observer.observe(this);
            });
        } else {
            $(".wc-product-card").addClass("is-visible");
        }

        // Refresh product list after creation
        function refreshProductList() {
            $.ajax({
                url: wcElWidget.productsRestUrl,
                method: "GET",
                success: function (products) {
                    var $list = $(".wc-product-list");
                    if (!$list.length) return;

                    if (!products.length) return;

                    var html = "";
                    $.each(products, function (i, p) {
                        html += '<div class="wc-product-card is-visible">';
                        html +=
                            '<div class="wc-product-card__badge">WooCommerce Product</div>';
                        html +=
                            '<h3 class="wc-product-card__name">' +
                            $("<span>").text(p.name).html() +
                            "</h3>";
                        html +=
                            '<div class="wc-product-card__price">$' +
                            parseFloat(p.price || 0).toFixed(2) +
                            "</div>";
                        html +=
                            '<a href="' +
                            p.permalink +
                            '" class="wc-product-card__link" target="_blank">View Product &rarr;</a>';
                        html +=
                            '<div class="wc-product-card__id">ID: #' +
                            p.product_id +
                            "</div>";
                        html += "</div>";
                    });
                    $list.html(html);
                },
            });
        }

        // Standalone form
        if ($("#wc-el-standalone-form").length === 0) return;

        $("#wc-standalone-submit").on("click", function () {
            var name = $.trim($("#wc-standalone-name").val());
            var price = $.trim($("#wc-standalone-price").val());
            var validation = validateProductInput(name, price);

            $("#wc-standalone-error").hide().text("");
            $("#wc-standalone-success").hide().text("");

            if (!validation.valid) {
                $("#wc-standalone-error").text(validation.message).show();
                if (validation.message.toLowerCase().indexOf("price") !== -1) {
                    $("#wc-standalone-price").focus();
                } else {
                    $("#wc-standalone-name").focus();
                }
                return;
            }

            var $btn = $("#wc-standalone-submit");
            $btn.prop("disabled", true);
            $(".wc-el-standalone-btn-text").hide();
            $(".wc-el-standalone-btn-spinner").show();

            $.ajax({
                url: wcElWidget.restUrl,
                method: "POST",
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("X-WP-Nonce", wcElWidget.nonce);
                },
                contentType: "application/json",
                data: JSON.stringify({
                    name: validation.name,
                    price: validation.price,
                }),
                success: function (response) {
                    $btn.prop("disabled", false);
                    $(".wc-el-standalone-btn-text").show();
                    $(".wc-el-standalone-btn-spinner").hide();

                    if (response.success) {
                        $("#wc-standalone-name").val("");
                        $("#wc-standalone-price").val("");
                        refreshProductList();
                        $("#wc-standalone-success")
                            .html(
                                "Product <strong>" +
                                    $("<span>").text(response.name).html() +
                                    "</strong>" +
                                    " created successfully! " +
                                    '<a href="' +
                                    response.permalink +
                                    '" target="_blank">View product &rarr;</a>',
                            )
                            .show();
                    } else {
                        $("#wc-standalone-error")
                            .text(
                                response.message || "Failed to create product.",
                            )
                            .show();
                    }
                },
                error: function (xhr) {
                    $btn.prop("disabled", false);
                    $(".wc-el-standalone-btn-text").show();
                    $(".wc-el-standalone-btn-spinner").hide();

                    var msg = "Request failed.";
                    try {
                        var body = JSON.parse(xhr.responseText);
                        msg = body.message || msg;
                    } catch (e) {}
                    $("#wc-standalone-error").text(msg).show();
                },
            });
        });
    });
})(jQuery);
