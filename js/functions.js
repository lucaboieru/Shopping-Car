var json;
var ip;
var states = [];

var hosts = {
    "emag.ro": "emag.png",
    "mediadot.ro": "mediadot.png",
    "pcgarage.ro": "pcgarage.png"
};

$(document).ready(function () {
    // this is for development
    ip = prompt("Please enter your server ip","");

    // load first tab
    $('.tab:first').show();
    $(".pageTitle").html("Categories");

    loadCategories();

    // tab select handler
    $('.navItem').on('click', function () {

        // get the right tab
        var tab = $(this).attr('data-action');

        $('.navItem').removeClass('active');
        $(this).addClass('active')

        // hide all tabs
        $('.tab').hide();

        // show the right tab
        var $currentTab = $('#' + tab);
        $currentTab.fadeIn(150);
        $(".pageTitle").html(capitaliseFirstLetter(tab));

        if (tab === 'categories') {
            // TODO we won't need this after the back button will work
            loadCategories();
        }

        // clear states and back button
        states = [];
        hideBackButton();
    });

    $(document).on('click', '.category', function() {
        if (!$(this).attr("subcategory")) {
            showBackButton();
            loadSubcategories($(this).attr("category"));
            states.push($(this).attr("category"));
        } else {
            loadProductList($(this).attr("category"), $(this).attr("subcategory"));
            states.push([$(this).attr("category"), $(this).attr("subcategory")]);
            showBackButton();
        }
    });

    // handle back button
    function onBackKeyDown () {
        handleState();
    }
    $(document).on('click', '.backButton', function() {
        handleState();
    })
});

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady(){
    document.addEventListener("backbutton", function(e){
        handleState();
    }, false);
}

function handleState () {

    if (!states.length) {
        hideBackButton();
        navigator.app.exitApp();
    }

    // last position
    var last = states.length - 1;
    if (typeof states[last] === 'string') {
        loadCategories();
        states.pop();
    } else if (states[last] instanceof Array) {
        loadSubcategories(states[last][0]);
        states.pop();
    }

    if (!states.length) {
        hideBackButton();
    }
}

function loadProductList (category, subcategory) {

    var params = {
        "class": category,
        "subclass": subcategory
    };

    makeAjaxPostCall("", params, function (data) {
        var elems = [];
        var products = JSON.parse(data);
        for(var i in products) {
            var $temp = $(".product-temp").clone();

            // add data to product template
            $temp.find(".host").attr("src", "images/" + hosts[products[i].host]);
            $temp.find(".product-img").attr("src", products[i].img);
            $temp.find(".price-tag").html(products[i].price);
            $temp.find(".old-price").html(products[i].oldPrice);
            $temp.find(".product-description .title").html(products[i].title);

            $temp.removeClass("product-temp");
            $temp.show();
            elems.push($temp);
        }
        $("#categories>.row").html(elems);
    });
}

function loadSubcategories (category) {

    var elems = [];

    for (var i in json) {
        if (json[i].class_id === category) {
            for (var j in json[i].subclass) {
                var $temp = $(".category-temp").clone();
                $temp.find(".category-title").html(json[i].subclass[j]);
                $temp.find(".category").attr("subcategory", json[i].subclass_id[j]);
                $temp.find(".category").attr("category", category);
                $temp.removeClass("category-temp");
                $temp.show();
                elems.push($temp);
            }
            break;
        }
    }
    $("#categories>.row").html(elems);
}

function loadCategories () {

    makeAjaxPostCall("getMappings", {}, function (data) {
        
        json = JSON.parse(data);
        var elems = [];

        for (var i in json) {
            var $temp = $(".category-temp").clone();
            $temp.find(".category-title").html(json[i].name);
            $temp.find(".category").attr("category", json[i].class_id);
            $temp.removeClass("category-temp");
            $temp.show();
            elems.push($temp);
        }
        $("#categories>.row").html(elems);
    });
}

function makeAjaxPostCall (url, params, callback) {

    // make the ajax request
    $.ajax({
        url:"http://" + ip + ":7777/" + url,
        type: 'post',
        cache: false,
        data: params,
        success: function(data){
            // do stuff with json (in this case an array)
            callback(data);
        },
        error: function(jqXHR, textStatus, err){
               alert('text status ' + textStatus + ', err ' + err)
           }    
    });
};

function showBackButton () {
    $(".backButton").show();
}

function hideBackButton () {
    $(".backbutton").hide();
}

function capitaliseFirstLetter (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}